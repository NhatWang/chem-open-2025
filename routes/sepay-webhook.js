const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");
const sendConfirmationEmail = require("../utils/sendReceipt");
const sendMail = require("../utils/mailer");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

router.post("/sepay-webhook", async (req, res) => {
  console.log("📦 Nhận webhook từ Sepay:", req.body);

  const { description } = req.body;

  // 🎯 Trích mã thanh toán từ nội dung ghi chú (CHEMOxxxxx)
  const match = description?.match(/\bCHEMO[A-Z0-9]{3,5}\b/i);
  const paymentCode = match ? match[0].toUpperCase() : null;

  if (!paymentCode) {
    return res.json({ success: false, message: "❌ Không tìm thấy mã thanh toán trong nội dung." });
  }

  const io = req.app.get("io");

  try {
    const user = await Registration.findOne({ paymentCode });

    if (!user) {
      await Registration.updateOne(
    { paymentCode },
    { $set: { paymentStatus: "failed" } }
  );
      return res.json({ success: false, message: `❌ Không tìm thấy người dùng với mã: ${paymentCode}` });
    }

    if (user.paymentStatus === "paid") {
      return res.json({ success: true, message: "🔁 Đã thanh toán trước đó." });
    }

    // ✅ Cập nhật trạng thái & xoá expireAt để không bị TTL xoá
    const result = await Registration.updateOne(
  { paymentCode },
  {
    $set: { paymentStatus: "paid" },
    $unset: { expireAt: "" }
  }
);

if (result.modifiedCount > 0) {
  io.emit("payment-updated", { mssv: user.mssv, status: "paid" });

  const updatedUser = await Registration.findOne({ paymentCode });

  try {
    await sendConfirmationEmail(updatedUser);
    console.log("✅ Đã gửi email xác nhận cho mã:", paymentCode);
  } catch (err) {
    console.error("❌ Lỗi gửi email xác nhận:", err);
  }

  if (ADMIN_EMAIL) {
    const adminMailOptions = {
      to: ADMIN_EMAIL,
      subject: `[Thông báo] Đã nhận thanh toán từ ${updatedUser.fullName}`,
      html: `
        <p>✅ ${updatedUser.fullName} vừa thanh toán thành công:</p>
        <ul>
          <li><b>Họ tên:</b> ${updatedUser.fullName}</li>
          <li><b>MSSV:</b> ${updatedUser.mssv}</li>
          <li><b>Email:</b> ${updatedUser.email}</li>
          <li><b>Số tiền:</b> ${updatedUser.amount.toLocaleString('vi-VN')} VNĐ</li>
          <li><b>Mã thanh toán:</b> ${updatedUser.paymentCode}</li>
          <li><b>Thời gian:</b> ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
        </ul>
      `
    };

    try {
      await sendMail(adminMailOptions);
      console.log("📤 Đã gửi thông báo admin:", ADMIN_EMAIL);
    } catch (adminErr) {
      console.warn("⚠️ Gửi mail admin thất bại:", adminErr.message);
    }
  }

  return res.json({ success: true, message: `✅ Đã xác nhận mã ${paymentCode}` });
}

// ❌ Trường hợp update thất bại (modifiedCount = 0)
return res.json({ success: false, message: "❌ Không thể cập nhật trạng thái thanh toán." });
  } catch (err) {
    console.error("❌ Lỗi khi xử lý webhook:", err);
    return res.status(500).json({ success: false, message: "❌ Lỗi máy chủ." });
  }
});
module.exports = router;

