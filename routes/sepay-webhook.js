const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");

router.post("/sepay-webhook", async (req, res) => {
  console.log("📦 Nhận webhook từ Sepay:", req.body);

  const { description } = req.body;

  // ✂️ Xoá phần đầu và cuối mặc định
  const cleaned = description
  .replace(/^BankAPINotify\s+Qacidd7396\s+SEPAY\d+\s+1\s+/, "")
  .replace(/\s+FT\d+\s+Trace\s+\d+$/, "");

console.log("🧹 Chuỗi đã làm sạch:", cleaned);

const parts = cleaned.trim().split(/\s+/);
const mssv = parts[0].trim().replace(/\r?\n|\r/g, "").replace(/\u200B/g, "");
const noidung = parts.slice(-2).join(" ");

  const io = req.app.get("io");

  try {
    const user = await Registration.findOne({ mssv: mssv.toString() });
  
    if (!user) {
      return res.json({ success: false, message: `Không tìm thấy MSSV: ${mssv}` });
    }
  
    // ⚠️ So sánh mssv từ chuyển khoản với mssv trong form
    if (user.mssv !== mssv.toString()) {
      return res.json({
        success: false,
        message: `MSSV không khớp: hệ thống nhận được ${mssv}, nhưng form ghi là ${user.mssv}`
      });
    }
  
    if (user.paymentStatus === "paid") {
      return res.json({ success: true, message: "Đã thanh toán trước đó." });
    }
  
    user.paymentStatus = "paid";
    await user.save();
  
    io.emit("payment-updated", { mssv, status: "paid" });
  
    return res.json({
      success: true,
      message: `✅ Xác nhận thanh toán cho MSSV: ${mssv}, nội dung: ${noidung}`
    });
  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// ❗ Đừng quên export router ra
module.exports = router;
