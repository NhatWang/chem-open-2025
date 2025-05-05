const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration"); // Đường dẫn đến model của bạn

// GET /api/payment-status?mssv=12345678
router.get("/payment-status", async (req, res) => {
  const mssv = req.query.mssv;

  if (!mssv) {
    return res.status(400).json({ success: false, message: "Thiếu MSSV" });
  }

  try {
    const record = await Registration.findOne({ mssv });

    if (!record) {
      return res.status(404).json({ success: false, message: "Không tìm thấy thông tin đăng ký" });
    }

    return res.json({ success: true, paymentStatus: record.paymentStatus });
  } catch (err) {
    console.error("Lỗi truy vấn trạng thái:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

module.exports = router;
