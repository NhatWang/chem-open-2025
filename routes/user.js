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
  const { username, password, role, mssv, email, fullName } = req.body;

  if (!username || !password || !role || !mssv || !email || !fullName) {
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

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed, role, mssv, email, fullName, pending: true });

    res.json({ success: true, message: "✅ Đăng ký thành công. Vui lòng chờ phê duyệt." });
  } catch (err) {
    console.error("❌ Lỗi đăng ký:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || user.pending) {
      return res.status(401).json({ success: false, message: "Tài khoản chưa được phê duyệt hoặc không tồn tại." });
    }

    const isMatch = await user.comparePassword(password);
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

    await User.findByIdAndUpdate(
  user._id,
  { active: true },
  { new: true }
);
const io = req.app.get("io");
io.emit("user-status-updated", { userId: user._id, active: true });

    res.json({ success: true, redirect: "/admin", user: user._id });
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Đăng xuất
router.post("/logout", async (req, res) => {
  const userId = req.session?.user?._id;
  if (!userId) return res.json({ success: false });

  try {
    await User.findByIdAndUpdate(userId, { active: false });
    const io = req.app.get("io");
    io.emit("user-status-updated", { userId, active: false });
  } catch (err) {
    console.warn("❌ Không thể cập nhật active:", err);
  }

  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false });
    res.clearCookie("connect.sid");
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
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông tin người dùng:", err);
    res.status(500).json({ success: false });
  }
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

  const resetLink = `https://www.chem-open2025.id.vn/reset-password.html?token=${token}`;
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
router.post("/reset-password", async (req, res) => {
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
    user.password = hashed;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "✅ Mật khẩu đã được đặt lại." });
  } catch (err) {
    console.error("❌ Lỗi reset password:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

router.post("/change-password", protect, async (req, res) => {
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
    user.password = hashed;
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
  const users = await User.find({}, "-password");
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
  const userId = req.params.id;
  const io = req.app.get("io");

  sessionStore.all(async (err, sessions) => {
    if (err) return res.status(500).json({ success: false });

    let count = 0;
    for (const sid in sessions) {
      let session = sessions[sid];
      if (typeof session === "string") {
        try {
          session = JSON.parse(session);
        } catch (e) {
          continue;
        }
      }

      if (session?.user?._id === userId) {
        sessionStore.destroy(sid, () => {});
        count++;
      }
    }

    try {
      await User.findByIdAndUpdate(userId, { active: false });
      const io = req.app.get("io");
      io.emit("user-status-updated", { userId, active: false });
    } catch (e) {
      console.error("❌ Lỗi cập nhật active:", e);
    }

    if (io) {
      io.to(userId).emit("force-logout");
    }

    res.json({ success: true, message: `✅ Đã đăng xuất ${count} phiên.` });
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
