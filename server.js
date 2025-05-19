require("dotenv").config();
console.log("✅ MONGO_URI:", process.env.MONGODB_URI);
console.log("🌍 ENV:", process.env.NODE_ENV || "development");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const MongoStore = require("connect-mongo");
const app = express();
const server = http.createServer(app); // dùng http để tạo server
const session = require("express-session");
const rateLimit = require("express-rate-limit");

app.set("trust proxy", 1); // cần thiết nếu dùng proxy (Heroku, Nginx, etc.)

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 3600000
  }
}));

// ⚡️ Khởi tạo socket.io
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["https://www.chem-open2025.id.vn","http://localhost:3000"], // hoặc cụ thể domain nếu deploy
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Gắn io vào app để các route khác có thể dùng
app.set("io", io);

const PORT = process.env.PORT || 3001;
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
})
.then(() => console.log("✅ Đã kết nối MongoDB Atlas (database: test)"))
.catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // chỉ cho phép 5 lần đăng nhập trong thời gian đó
  message: "🚫 Quá nhiều lần đăng nhập sai, vui lòng thử lại sau 15 phút."
});
app.use("/api/login", loginLimiter);

app.use(cors({
  origin: "https://www.chem-open2025.id.vn/", // hoặc đúng domain frontend của bạn
  credentials: true
}));
app.use(express.json());

// Gắn các routes
app.use("/api", require("./routes/register"));
app.use("/api", require("./routes/registrations"));
app.use("/api", require("./routes/update-payment"));
app.use("/api", require("./routes/payment-status"));
app.use("/api", require("./routes/delete-registration"));
app.use("/api", require("./routes/sepay-webhook")); // Webhook sẽ emit qua io
app.use("/api", require("./routes/login"));
app.use('/api', require('./routes/draw'));
app.use('/api', require('./routes/admin'));
// Phục vụ HTML
app.get("/dang-ky", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_register.html"));
});
app.get("/dang-nhap", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_login.html"));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_index.html"));
});
app.get("/boctham", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chemopen_draw.html"));
});
app.get("/admin", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/dang-nhap");
  }
  res.sendFile(path.join(__dirname, "public", "chemopen_admin.html"));
});

app.use(express.static(path.join(__dirname, "public")));

// 🚀 Start server + socket
server.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
