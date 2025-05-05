const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");

// Trả về tất cả dữ liệu đăng ký
router.get("/registrations", async (req, res) => {
  try {
    const allRegs = await Registration.find();
    res.json(allRegs);
  } catch (err) {
    res.status(500).json({ error: "Lỗi truy vấn dữ liệu!" });
  }
});

module.exports = router;