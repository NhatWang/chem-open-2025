const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const router = express.Router();

const User = require("../models/User");
const { protect, requireRole } = require("../middlewares/auth");
const sendMail = require("../utils/sendMail");


// ========================
// 🔐 1. AUTHENTICATION
// ========================

// Đăng ký tài khoản
router.post("/register-user", async (req, res) => {
  const { username, ***HIDDEN***, role, mssv, email, fullName } = req.body;

  if (!username || !***HIDDEN*** || !role || !mssv || !email || !fullName) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin." });
  }

  if (!["admin", "collab"].includes(role)) {
    return res.status(400).json({ success: false, message: "Vai trò không hợp lệ." });
  }

  try {
    const [exists, mssvExists, emailExists] = await Promise.all([
      User.findOne({ username }),
      User.findOne({ mssv }),
      User.findOne({ email }),
    ]);

    if (exists) return res.status(409).json({ success: false, message: "Tài khoản đã tồn tại." });
    if (mssvExists) return res.status(409).json({ success: false, message: "MSSV đã được dùng." });
    if (emailExists) return res.status(409).json({ success: false, message: "Email đã được dùng." });

    const hashed = await bcrypt.hash(***HIDDEN***, 10);
    await User.create({ username, ***HIDDEN***: hashed, role, mssv, email, fullName, pending: true });

    res.json({ success: true, message: "✅ Đăng ký thành công. Vui lòng chờ phê duyệt." });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { username, ***HIDDEN*** } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || user.pending) {
      return res.status(401).json({ success: false, message: "Tài khoản chưa được phê duyệt hoặc không tồn tại." });
    }

    const isMatch = await user.comparePassword(***HIDDEN***);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu." });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName || "",
      mssv: user.mssv || "",
    };

    res.json({ success: true, redirect: "/admin" });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Đăng xuất
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Kiểm tra trạng thái đăng nhập
router.get("/check-auth", (req, res) => {
  if (req.session.user) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  return res.json({ authenticated: false });
});

// Lấy thông tin người dùng hiện tại
router.get("/me", protect, (req, res) => {
  res.json({ success: true, user: req.session.user });
});


// ========================
// 🔁 2. RESET PASSWORD
// ========================

// Gửi email khôi phục
router.post("/request-reset", async (req, res) => {
  const { username, email } = req.body;

  const user = await User.findOne({ username, email });
  if (!user) return res.status(404).json({ success: false, message: "Tên đăng nhập hoặc email không khớp." });

  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetLink = `https://www.chem-open2025.id.vn/reset-***HIDDEN***.html?token=${token}`;
  await sendMail({
  to: user.email,
  subject: "Khôi phục mật khẩu",
  html: `
    <p>Xin chào <strong>${user.fullName || user.username}</strong>,</p>
    <p>Bạn đã yêu cầu khôi phục mật khẩu tại hệ thống CHEM-OPEN.</p>
    <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
    <p><a href="${resetLink}" style="padding: 10px 20px; background: #0b5394; color: #fff; text-decoration: none;">Đặt lại mật khẩu</a></p>
    <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email.</p>
    <p>Trân trọng,<br/>Liên chi Hội khoa Hoá học.</p>
  `
});

  res.json({ success: true });
});

// Đặt lại mật khẩu
router.post("/reset-***HIDDEN***", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Thiếu token hoặc mật khẩu mới." });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.***HIDDEN*** = hashed;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "✅ Mật khẩu đã được đặt lại." });
  } catch (err) {
    console.error("❌ Lỗi reset ***HIDDEN***:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

router.post("/change-***HIDDEN***", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Thiếu mật khẩu hiện tại hoặc mật khẩu mới." });
  }

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Mật khẩu hiện tại không đúng." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.***HIDDEN*** = hashed;
    await user.save();

    res.json({ success: true, message: "✅ Đã đổi mật khẩu thành công." });
  } catch (err) {
    console.error("❌ Lỗi đổi mật khẩu:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});


// ========================
// 🧑‍💼 3. ADMIN FUNCTIONS
// ========================

// Middleware chỉ cho superadmin
function isSuperadmin(req, res, next) {
  if (req.session?.user?.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  next();
}

// Lấy danh sách người dùng
router.get("/users", isSuperadmin, async (req, res) => {
  const users = await User.find({}, "-***HIDDEN***");
  res.json(users);
});

// Duyệt tài khoản
router.put("/approve-user/:id", protect, requireRole(["superadmin"]), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { pending: false }, { new: true });

    if (user?.email) {
      await sendMail({
        to: user.email,
        subject: "TÀI KHOẢN ĐÃ ĐƯỢC DUYỆT",
        html: `<p>Xin chào <strong>${user.fullName || user.username}</strong>,</p>
        <p>Tài khoản của bạn đã được duyệt để sử dụng hệ thống quản lý CHEM-OPEN 2025.</p>
        <p>Bạn có thể đăng nhập tại: <a href="https://www.chem-open2025.id.vn/chemopen_login.html">TRANG ĐĂNG NHẬP</a></p>
        <p>Trân trọng,<br/>BCH Liên chi Hội khoa Hóa học.</p>`
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi duyệt tài khoản:", err);
    res.status(500).json({ success: false });
  }
});

// Từ chối tài khoản
router.delete("/reject-user/:id", async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Lỗi khi xoá tài khoản:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Đăng xuất người dùng khác (force logout)
router.post("/logout/:id", isSuperadmin, async (req, res) => {
  const sessionStore = req.sessionStore;
  sessionStore.all((err, sessions) => {
    if (err) return res.status(500).json({ success: false, message: "Không thể lấy session." });

    let count = 0;
    for (const sid in sessions) {
      const session = JSON.parse(sessions[sid]);
      if (session?.user?._id === req.params.id) {
        sessionStore.destroy(sid);
        count++;
      }
    }

    res.json({ success: true, message: `✅ Đã đăng xuất ${count} phiên hoạt động.` });
  });
});

// Cập nhật thông tin người dùng
router.put("/change-role/:id", protect, requireRole(["superadmin"]), async (req, res) => {
  const { role } = req.body;

  if (!["admin", "collab", "superadmin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Vai trò không hợp lệ." });
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật vai trò:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});


module.exports = router;
