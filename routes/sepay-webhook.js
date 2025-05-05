const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration"); // Đảm bảo bạn đã có model này

router.post("/sepay-webhook", async (req, res) => {
  try {
    const data = req.body;

    // Chỉ xử lý giao dịch chuyển tiền vào
    if (data.transferType !== "in") {
      return res.status(200).json({ success: true, message: "Bỏ qua giao dịch không hợp lệ" });
    }

    const note = data.content || "";
    const mssv = note.split("_")[0]?.trim();

    if (!mssv) {
      return res.status(400).json({ success: false, message: "Thiếu MSSV trong nội dung chuyển khoản" });
    }

    const transferAmount = parseInt(data.transferAmount);

    const registration = await Registration.findOne({ mssv });

    if (!registration) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký tương ứng" });
    }

    if (parseInt(registration.amount) !== transferAmount) {
      return res.status(400).json({ success: false, message: "Số tiền không khớp với đăng ký" });
    }

    await Registration.updateOne(
      { mssv },
      { $set: { paymentStatus: "paid" } }
    );

    console.log(`✅ SePay: Đã cập nhật trạng thái "paid" cho MSSV: ${mssv}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Lỗi xử lý webhook SePay:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
