const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const Registration = require("../models/Registration");

// Xoá đơn đăng ký theo MSSV (cho admin)
router.delete("/delete-registration", async (req, res) => {
  const mssv = req.query.mssv;
  if (!mssv) return res.status(400).json({ success: false, message: "Thiếu MSSV" });

  try {
    const result = await Registration.findOneAndDelete({ mssv });
    if (!result) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký với MSSV này" });
    }

    res.json({ success: true, message: "Đã xoá thành công theo MSSV" });
  } catch (err) {
    console.error("❌ Lỗi khi xoá theo MSSV:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Xoá đơn đăng ký theo paymentCode (cho người dùng bấm "Quay lại")
router.delete("/delete-registration/:paymentCode", async (req, res) => {
  const paymentCode = req.params.paymentCode?.trim()?.toUpperCase();
  if (!paymentCode) return res.status(400).json({ success: false, message: "Thiếu paymentCode" });

  try {
    const result = await Registration.findOneAndDelete({ paymentCode });
    if (!result) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký với paymentCode này" });
    }

    res.json({ success: true, message: "Đã xoá thành công theo paymentCode" });
  } catch (err) {
    console.error("❌ Lỗi khi xoá theo paymentCode:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

module.exports = router;