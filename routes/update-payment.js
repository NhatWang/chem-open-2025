const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");

// PUT /api/update-payment
router.put("/update-payment", async (req, res) => {
  const { mssv, paymentStatus } = req.body;

  if (!mssv || !paymentStatus) {
    return res.status(400).json({ error: "Thiếu MSSV hoặc trạng thái" });
  }

  try {
    const updated = await Registration.findOneAndUpdate(
      { mssv },
      { paymentStatus },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Không tìm thấy sinh viên" });
    }

    res.json({ message: "Cập nhật thành công", updated });
  } catch (err) {
    console.error("❌ MongoDB update error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;