const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");

router.post("/sepay-webhook", async (req, res) => {
  console.log("📦 Nhận webhook từ Sepay:", req.body);

  const { description } = req.body;

  // 🎯 Trích mã thanh toán từ nội dung ghi chú (CHEMOxxxxx)
  const match = description?.match(/\bCHEMO[A-Z0-9]{3,5}\b/i);
  const paymentCode = match ? match[0].toUpperCase() : null;

  if (!paymentCode) {
    return res.json({ success: false, message: "❌ Không tìm thấy mã thanh toán trong nội dung." });
  }

  const io = req.app.get("io");

  try {
    const user = await Registration.findOne({ paymentCode });

    if (!user) {
      return res.json({ success: false, message: `❌ Không tìm thấy người dùng với mã: ${paymentCode}` });
    }

    if (user.paymentStatus === "paid") {
      return res.json({ success: true, message: "🔁 Đã thanh toán trước đó." });
    }

    user.paymentStatus = "paid";
    await user.save();

    io.emit("payment-updated", { mssv: user.mssv, status: "paid" });

    return res.json({ success: true, message: `✅ Đã xác nhận mã ${paymentCode}` });
  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

module.exports = router;
