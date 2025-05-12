const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

router.post('/register', async (req, res) => {
  try {
    const data = req.body;

    // 🎯 Nếu đơn là pending thì set TTL (10 phút)
    if (!data.paymentStatus || data.paymentStatus === 'pending') {
      data.expireAt = new Date(Date.now() + 10 * 60 * 1000);
    } else {
      delete data.expireAt; // 💥 Quan trọng: không gán TTL nếu đã "paid"
    }

    // 🎯 Ngăn MSSV tạo nhiều đơn nếu đơn pending đã tồn tại
    const existingPending = await Registration.findOne({
      mssv: data.mssv,
      paymentStatus: "pending"
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "❗ MSSV này đã có đơn đăng ký chưa thanh toán. Vui lòng thanh toán hoặc đợi đơn cũ hết hạn."
      });
    }

    // 🎯 Cho phép đăng ký mới nếu đơn cũ đã "paid" hoặc "failed"
    const newEntry = new Registration(data);
    const saved = await newEntry.save();

    return res.json({ success: true, data: saved });
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký:", err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
