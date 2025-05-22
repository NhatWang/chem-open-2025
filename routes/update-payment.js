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

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.MONGODB_URI) {
  throw new Error("❌ Thiếu biến môi trường: EMAIL_USER, EMAIL_PASS hoặc MONGODB_URI.");
}

mongoose.connect(process.env.MONGODB_URI);

function buildMainMailOptions(user, pdfBuffer) {
  return {
    from: `BAN TỔ CHỨC CHEM-OPEN NĂM 2025 <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: generateMainHTML(user.fullName),
    attachments: [
      {
        filename: `${user.paymentCode} - Biên nhận thanh toán Giải đấu Chem - Open 2025.pdf`,
        content: pdfBuffer,
      },
      {
        filename: "lch.png",
        path: path.resolve(__dirname, "../public/images/chemopen/lch.png"),
        cid: "logoLCH"
      },
    ]
  };
}

function buildPartnerMailOptions(partner, mainUser, pdfBuffer) {
  return {
    from: `BAN TỔ CHỨC CHEM-OPEN NĂM 2025 <${process.env.EMAIL_USER}>`,
    to: partner.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: generatePartnerHTML(partner.fullName, mainUser.fullName),
    attachments: [
      {
        filename: `${mainUser.paymentCode} - Biên nhận thanh toán Giải đấu Chem - Open 2025.pdf`,
        content: pdfBuffer,
      },
      {
        filename: "lch.png",
        path: path.resolve(__dirname, "../public/images/chemopen/lch.png"),
        cid: "logoLCH"
      },
    ]
  };
}

router.put("/update-payment", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  const { paymentStatus, paymentCode } = req.body;

  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "Thiếu mã thanh toán." });
  }

  const validStatuses = ["pending", "paid", "failed"];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
  }

  try {
    const updated = await Registration.findOneAndUpdate(
      { paymentCode },
      { $set: { paymentStatus }, $unset: { expireAt: "" } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký." });
    }

    if (paymentStatus === "paid") {
      const pdfBuffer = await generateReceiptPDF(updated);
      const mainSent = await sendMail(buildMainMailOptions(updated, pdfBuffer));

      if (updated.partnerInfo?.email) {
        await sendMail(buildPartnerMailOptions(updated.partnerInfo, updated, pdfBuffer));
      }

      if (!mainSent) {
        return res.status(500).json({
          success: false,
          message: "Đã cập nhật trạng thái nhưng lỗi khi gửi email."
        });
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

router.post("/send-partner-mail", async (req, res) => {
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

router.post("/resend-mail", async (req, res) => {
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
    await sendMail(buildMainMailOptions(registration, pdfBuffer));

    if (registration.partnerInfo?.email) {
      await sendMail(buildPartnerMailOptions(registration.partnerInfo, registration, pdfBuffer));
    }

    return res.json({ success: true, message: `✅ Đã gửi lại email cho ${registration.email}` });
  } catch (err) {
    console.error(`❌ Lỗi khi gửi lại email cho ${paymentCode}:`, err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi gửi lại email." });
  }
});

module.exports = router;
