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
      delete data.expireAt; // Không gán TTL nếu đã "paid"
    }

    // 🎯 Nếu MSSV đã có đơn "pending", thì ghi đè
    const updated = await Registration.findOneAndUpdate(
      { mssv: data.mssv, paymentStatus: "pending" },
      data,
      { new: true }
    );

    if (updated) {
          return res.json({
      success: true,
      message: "✅ Đã cập nhật đơn đăng ký cũ.",
      data: {
        ...updated.toObject(),
        serverTime: new Date().toISOString() // Thêm thời gian server để sync
      }
    });
    }

    // 🎯 Nếu không tìm thấy đơn pending thì tạo mới
    const newEntry = new Registration(data);
    const saved = await newEntry.save();

        return res.json({
      success: true,
      message: "✅ Đã tạo đơn đăng ký mới.",
      data: {
        ...saved.toObject(),
        serverTime: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("❌ Lỗi khi đăng ký:", err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
