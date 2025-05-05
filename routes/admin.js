// Lấy tất cả thí sinh đã đăng ký
router.get("/registrations", async (req, res) => {
  const data = await Registration.find().sort({ createdAt: -1 });
  res.json(data);
});

// Cập nhật trạng thái thanh toán (thủ công)
router.put("/update-payment", async (req, res) => {
  const { mssv, paymentStatus } = req.body;
  await Registration.findOneAndUpdate({ mssv }, { paymentStatus });
  res.json({ success: true });
});