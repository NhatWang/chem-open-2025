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
const sendConfirmationEmail = require("../utils/sendReceipt");

if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM || !process.env.MONGODB_URI) {
  throw new Error("❌ Thiếu SENDGRID_API_KEY, SENDGRID_FROM hoặc MONGODB_URI.");
}

mongoose.connect(process.env.MONGODB_URI);

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

    return res.json({
      success: true,
      message: "✅ Đã cập nhật trạng thái."
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

router.post("/resend-mail", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  const { paymentCode } = req.body;

  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "❌ Thiếu mã thanh toán." });
  }

  try {
    const registration = await Registration.findOne({ paymentCode });
    if (!registration) {
      return res.status(404).json({ success: false, message: "❌ Không tìm thấy đơn đăng ký." });
    }

    if (registration.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "❌ Chỉ gửi lại email cho đơn đã thanh toán." });
    }

    const pdfBuffer = await generateReceiptPDF(registration);
    const emailMain = registration.email;
    const emailPartner = registration.partnerInfo?.email;

    const tasks = [sendMail(buildMainMailOptions(registration, pdfBuffer))];
    if (emailPartner) {
      tasks.push(sendMail(buildPartnerMailOptions(registration.partnerInfo, registration, pdfBuffer)));
    }

    const [mainResult, partnerResult] = await Promise.allSettled(tasks);

    if (mainResult.status !== "fulfilled") {
      return res.status(500).json({
        success: false,
        message: "❌ Lỗi khi gửi lại email chính.",
      });
    }

    // Log partner email nếu có
    if (emailPartner) {
      if (partnerResult?.status === "fulfilled") {
        console.log(`✅ Đã gửi lại email cho partner: ${emailPartner}`);
      } else {
        console.warn(`⚠️ Không gửi được mail partner đến ${emailPartner}:`, partnerResult?.reason);
      }
    }

    const msg = `📧 Đã gửi lại email cho ${emailMain}` + (emailPartner ? ` và ${emailPartner}` : "");
    return res.json({ success: true, message: msg });
  } catch (err) {
    console.error(`❌ Lỗi khi gửi lại email cho ${paymentCode}:`, err);
    return res.status(500).json({ success: false, message: "❌ Lỗi máy chủ khi gửi lại email." });
  }
});


module.exports = router;