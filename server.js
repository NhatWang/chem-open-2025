require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const mongoURI = process.env.MONGODB_URI; // 👉 đúng biến tên

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Đã kết nối MongoDB Atlas"))
  .catch(err => console.error("❌ Lỗi MongoDB:", err));

// Gắn routes
const registerRoute = require("./routes/register");
app.use("/api", registerRoute);
const registrationsRoute = require("./routes/registrations");
app.use("/api", registrationsRoute);
const updatePaymentRoute = require("./routes/update-payment");
app.use("/api", updatePaymentRoute);
const paymentStatusRoute = require("./routes/payment-status");
app.use("/api", paymentStatusRoute);
const deleteRoute = require("./routes/delete-registration");
app.use("/api", deleteRoute);
const sepayWebhookRoute = require("./routes/sepay-webhook");
app.use("/api", sepayWebhookRoute);

const path = require("path");

// Phục vụ chemopen_index.html khi vào /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_admin.html"));
});

// Sau đó mới cấu hình static
app.use(express.static(path.join(__dirname, "public")));

// Start server
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));