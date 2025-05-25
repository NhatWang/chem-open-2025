// Updated: Tách và dùng sendMail từ utils/mailer
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const path = require("path");
const generateReceiptPDF = require("../utils/generateReceiptPDF");
const { protect, requireRole } = require("../middlewares/auth");
const sendMail = require("../utils/mailer");
const { generateMainHTML, generatePartnerHTML } = require("../utils/mailTemplates");

if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM || !process.env.MONGODB_URI) {
  throw new Error("❌ Thiếu SENDGRID_API_KEY, SENDGRID_FROM hoặc MONGODB_URI.");
}

mongoose.connect(process.env.MONGODB_URI);

function buildMainMailOptions(user, pdfBuffer) {
  return {
    to: user.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: generateMainHTML(user.fullName),
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: `${user.paymentCode} - Biên nhận thanh toán giải đấu CHEM-OPEN 2025.pdf`,
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };
}

function buildPartnerMailOptions(partner, mainUser, pdfBuffer) {
  return {
    to: partner.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: generatePartnerHTML(partner.fullName, mainUser.fullName),
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: `${mainUser.paymentCode} - Biên nhận thanh toán giải đấu CHEM-OPEN 2025.pdf`,
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };
}
router.put("/update-payment", async (req, res) => {
  const { paymentStatus, paymentCode } = req.body;

  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "Thiếu mã thanh toán." });
  }

  const validStatuses = ["pending", "paid", "failed"];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
  }

  try {
    // Lấy trạng thái cũ trước khi update
    const existing = await Registration.findOne({ paymentCode });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký." });
    }

    const wasPending = existing.paymentStatus === "pending";

    // Cập nhật trạng thái mới
    const updated = await Registration.findOneAndUpdate(
      { paymentCode },
      { $set: { paymentStatus }, $unset: { expireAt: "" } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký sau khi cập nhật." });
    }

    // Chỉ gửi mail nếu từ pending chuyển sang paid
    if (paymentStatus === "paid" && wasPending) {
      const pdfBuffer = await generateReceiptPDF(updated);
      const tasks = [sendMail(buildMainMailOptions(updated, pdfBuffer))];

      if (updated.partnerInfo?.email) {
        tasks.push(sendMail(buildPartnerMailOptions(updated.partnerInfo, updated, pdfBuffer)));
      }

      const [mainResult, partnerResult] = await Promise.allSettled(tasks);

      if (mainResult.status !== "fulfilled") {
        return res.status(500).json({
          success: false,
          message: "Đã cập nhật trạng thái nhưng lỗi khi gửi email chính.",
        });
      }

      if (partnerResult?.status !== "fulfilled") {
        console.warn(`⚠️ Không gửi được mail partner đến ${updated.partnerInfo.email}:`, partnerResult.reason);
      }
    }

    return res.json({
      success: true,
      message: "✅ Đã cập nhật trạng thái và gửi mail (nếu applicable)."
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});


router.post("/send-partner-mail", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  const { paymentCode } = req.body;
  const reg = await Registration.findOne({ paymentCode });

  if (!reg || reg.paymentStatus !== "paid" || !reg.partnerInfo?.email) {
    return res.status(400).json({ success: false, message: "Không hợp lệ." });
  }

  try {
    const pdfBuffer = await generateReceiptPDF(reg);
    await sendMail(buildPartnerMailOptions(reg.partnerInfo, reg, pdfBuffer));
    return res.json({ success: true, message: `✅ Đã gửi mail cho partner ${reg.partnerInfo.email}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi khi gửi mail cho partner." });
  }
});

router.post("/resend-mail", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  const { paymentCode } = req.body;

  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "Thiếu mã thanh toán." });
  }

  try {
    const registration = await Registration.findOne({ paymentCode });

    if (!registration) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký." });
    }

    if (registration.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "Chỉ gửi lại email cho đơn đã thanh toán." });
    }

    const pdfBuffer = await generateReceiptPDF(registration);
    const tasks = [sendMail(buildMainMailOptions(registration, pdfBuffer))];
    if (registration.partnerInfo?.email) {
      tasks.push(sendMail(buildPartnerMailOptions(registration.partnerInfo, registration, pdfBuffer)));
    }
    const [mainResult, partnerResult] = await Promise.allSettled(tasks);

    if (mainResult.status !== "fulfilled") {
      return res.status(500).json({
        success: false,
        message: "Lỗi khi gửi lại email chính.",
      });
    }

    // Nếu mail phụ lỗi, vẫn thành công nhưng log
    if (partnerResult?.status !== "fulfilled") {
      console.warn(`⚠️ Không gửi được mail partner đến ${registration.partnerInfo.email}:`, partnerResult.reason);
    }

    return res.json({ success: true, message: `✅ Đã gửi lại email cho ${registration.email}` });
  } catch (err) {
    console.error(`❌ Lỗi khi gửi lại email cho ${paymentCode}:`, err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi gửi lại email." });
  }
});

module.exports = router;
