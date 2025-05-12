const express = require("express");
const router = express.Router();

const adminUser = process.env.ADMIN_USERNAME;
const adminPass = process.env.ADMIN_PASSWORD;

router.post("/login", (req, res) => {
  const { username, ***HIDDEN*** } = req.body;

  if (username === adminUser && ***HIDDEN*** === adminPass) {
    req.session.user = { username };
    return res.json({ success: true, redirect: "/admin" });
  }

  return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu." });
});

// Kiểm tra đã đăng nhập chưa (dùng ở /admin.html)
router.get("/check-auth", (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

// Đăng xuất
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
