require("dotenv").config();
console.log("✅ MONGO_URI:", process.env.MONGODB_URI);
console.log("🌍 ENV:", process.env.NODE_ENV || "development");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app); // dùng http để tạo server

// ⚡️ Khởi tạo socket.io
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // hoặc cụ thể domain nếu deploy
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Gắn io vào app để các route khác có thể dùng
app.set("io", io);

const PORT = process.env.PORT || 3001;
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
  dbName: "test", // Rất quan trọng nếu URI chưa rõ tên DB
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Đã kết nối MongoDB Atlas (database: test)"))
.catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

app.use(cors());
app.use(express.json());

// Gắn các routes
app.use("/api", require("./routes/register"));
app.use("/api", require("./routes/registrations"));
app.use("/api", require("./routes/update-payment"));
app.use("/api", require("./routes/payment-status"));
app.use("/api", require("./routes/delete-registration"));
app.use("/api", require("./routes/sepay-webhook")); // Webhook sẽ emit qua io

// Phục vụ HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_admin.html"));
});

app.use(express.static(path.join(__dirname, "public")));

// 🚀 Start server + socket
server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
