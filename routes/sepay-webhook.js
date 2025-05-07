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
const mssv = String(parts[0]).trim();
const noidung = parts.slice(-2).join(" ");

  const io = req.app.get("io");

  try {
    const user = await Registration.findOne({ mssv });

    if (!user) {
      const all = await Registration.find({});
      console.log("🧐 Các MSSV hiện có:", all.map(u => u.mssv));
      return res.json({ success: false, message: `Không tìm thấy MSSV: ${mssv}` });
    }

    if (user.paymentStatus === "paid") {
      return res.json({ success: true, message: "Đã thanh toán trước đó." });
    }

    user.paymentStatus = "paid";
    await user.save();

    io.emit("payment-updated", { mssv, status: "paid" });

    return res.json({ success: true, message: `✅ Xác nhận thanh toán cho MSSV: ${mssv}, nội dung: ${noidung}` });
  } catch (err) {
    console.error("❌ Lỗi xử lý webhook:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// ❗ Đừng quên export router ra
module.exports = router;
