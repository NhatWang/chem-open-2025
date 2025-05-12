const express = require("express");
const router = express.Router();
const { protect } = require('../middlewares/auth');
const Registration = require("../models/Registration");

router.delete("/delete-registration", async (req, res) => {
  const mssv = req.query.mssv;
  if (!mssv) return res.status(400).json({ success: false, message: "Thiếu MSSV" });

  try {
    const result = await Registration.findOneAndDelete({ mssv });
    if (!result) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn" });
    }

    res.json({ success: true, message: "Xoá thành công" });
  } catch (err) {
    console.error("❌ Xoá lỗi:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

module.exports = router;
