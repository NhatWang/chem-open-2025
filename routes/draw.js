const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
console.log("✅ draw.js loaded");

const drawPool = {
  "Đơn nam": Array.from({ length: 32 }, (_, i) => `A${i + 1}`),
  "Đơn nữ": Array.from({ length: 16 }, (_, i) => `B${i + 1}`),
  "Đôi nam nữ": Array.from({ length: 16 }, (_, i) => `C${i + 1}`),
  "Đôi nam": Array.from({ length: 16 }, (_, i) => `D${i + 1}`),
  "Đôi nữ": Array.from({ length: 8 }, (_, i) => `E${i + 1}`),
};

// ✅ API kiểm tra trước khi bốc
router.get('/precheck/:paymentCode', async (req, res) => {
  try {
    const paymentCode = req.params.paymentCode.trim().toUpperCase();
    const user = await Registration.findOne({ paymentCode });

    if (!user) return res.json({ success: false, message: "Không tìm thấy mã này." });

    // ✅ Convert drawResult Map to plain object if needed
    const drawResultObject = user.drawResult instanceof Map
      ? Object.fromEntries(user.drawResult)
      : user.drawResult?.toObject?.() || user.drawResult || {};

    if (drawResultObject && Object.keys(drawResultObject).length > 0) {
      return res.json({
        success: false,
        message: "Bạn đã bốc thăm trước đó.",
        fullName: user.fullName,
        noidung: user.noidung,
        drawResult: drawResultObject
      });
    }

    if (user.paymentStatus !== "paid") {
      return res.json({ success: false, message: "Bạn chưa thanh toán." });
    }

    return res.json({
      success: true,
      fullName: user.fullName,
      noidung: user.noidung
    });
  } catch (err) {
    console.error("❌ Lỗi precheck:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

// ✅ API bốc mã cho tất cả nội dung
router.get('/draw/:paymentCode', async (req, res) => {
  try {
    const paymentCode = req.params.paymentCode.trim().toUpperCase();
    const user = await Registration.findOne({ paymentCode });

    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng với mã này" });

    const drawResultObject = user.drawResult instanceof Map
      ? Object.fromEntries(user.drawResult)
      : user.drawResult?.toObject?.() || user.drawResult || {};

    if (drawResultObject && Object.keys(drawResultObject).length > 0) {
      return res.json({
        success: true,
        fullName: user.fullName,
        noidung: user.noidung,
        drawResult: drawResultObject
      });
    }

    const drawResult = {};
    for (const event of user.noidung) {
      const used = await Registration.find({ [`drawResult.${event}`]: { $exists: true } });
      const usedCodes = used.map(doc => doc.drawResult?.[event]).filter(Boolean);
      const available = drawPool[event].filter(code => !usedCodes.includes(code));

      drawResult[event] = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : "❌ Hết mã";
    }

    user.drawResult = drawResult;
    user.expireAt = undefined;
    await user.save();

    return res.json({
      success: true,
      fullName: user.fullName,
      noidung: user.noidung,
      drawResult
    });
  } catch (err) {
    console.error("❌ Lỗi bốc thăm:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

module.exports = router;
