const express = require("express");
const router = express.Router();
const Registration = require("../models/Registration");

router.post("/sepay-webhook", async (req, res) => {
  console.log("📦 Nhận webhook từ Sepay:", req.body);

  const { description } = req.body;

  // ✂️ Xoá phần đầu và cuối mặc định
  const cleaned = description
    .replace(/^BankAPINotify Qacidd7396 SEPAY\d+ 1 /, "") // bỏ đầu
    .replace(/ FT\d+ Trace \d+$/, "");                    // bỏ cuối

  console.log("🧹 Sau khi xử lý chuỗi:", cleaned);

  const parts = cleaned.trim().split(" ");
  const mssv = parts[0];
  const noidung = parts.slice(-2).join(" "); // VD: "Don nam"

  const io = req.app.get("io");

  try {
    const user = await Registration.findOne({ mssv });

    if (!user) {
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
