const express = require('express');
const router = express.Router(); // ⬅️ PHẢI CÓ DÒNG NÀY
const Registration = require('../models/Registration'); // chỉnh đường dẫn nếu cần
const { protect, requireRole } = require("../middlewares/auth");

// ✅ Lấy tất cả thí sinh đã đăng ký
router.get("/registrations", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  const data = await Registration.find().sort({ createdAt: -1 });
  res.json(data);
});

// ✅ Cập nhật trạng thái thanh toán (thủ công)
router.put("/update-payment", protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  const { mssv, paymentStatus } = req.body;
  await Registration.findOneAndUpdate({ mssv }, { paymentStatus });
  res.json({ success: true });
});

// ✅ Lấy kết quả bốc thăm
router.get('/admin/draw-results', protect, requireRole(["admin", "superadmin"]), async (req, res) => {
  try {
    const users = await Registration.find({ "drawResult": { $exists: true, $ne: {} } });
    res.json(users);
  } catch (err) {
    console.error("❌ Lỗi khi lấy drawResults:", err);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

module.exports = router; // ⬅️ PHẢI CÓ DÒNG NÀY
