const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const Registration = require('../models/Registration');

router.get('/registrations', protect, async (req, res) => {
  try {
    const list = await Registration.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách đăng ký:", err);
    res.status(500).json({ success: false, message: "Lỗi server khi truy vấn dữ liệu." });
  }
});


module.exports = router;