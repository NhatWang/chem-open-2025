const express = require("express");
const router = express.Router();
const { protect } = require('../middlewares/auth');
const Registration = require("../models/Registration");

router.put("/update-payment", async (req, res) => {
  const { paymentStatus, paymentCode } = req.body;

  // ⚠️ Validate đầu vào
  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "Thiếu mã thanh toán." });
  }

  try {
    const result = await Registration.updateOne(
      { paymentCode },
      {
        $set: { paymentStatus },
        $unset: { expireAt: "" }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không có thay đổi." });
    }

    return res.json({ success: true, message: "✅ Cập nhật trạng thái thành công." });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});
  const validStatuses = ["pending", "paid", "failed"];
if (!validStatuses.includes(paymentStatus)) {
  return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
}

module.exports = router;
