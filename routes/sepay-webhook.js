const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");

router.post("/sepay-webhook", async (req, res) => {
  const { amount, note } = req.body;

  const regex = /^(\d{8})/; // MSSV đầu chuỗi
  const match = note?.match(regex);

  if (!match) {
    return res.json({ success: true, message: "Bỏ qua giao dịch không hợp lệ" });
  }

  const mssv = match[1];
  const io = req.app.get("io"); // Lấy socket instance

  try {
    const user = await Registration.findOne({ mssv });

    if (!user) {
      return res.json({ success: false, message: `Không tìm thấy MSSV: ${mssv}` });
    }

    user.paymentStatus = "paid";
    await user.save();

    // Gửi sự kiện tới tất cả client đang kết nối
    io.emit("payment-updated", { mssv, status: "paid" });

    return res.json({ success: true, message: `✅ Đã xác thực cho MSSV: ${mssv}` });
  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

module.exports = router;