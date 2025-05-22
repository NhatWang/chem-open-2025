function protect(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // ✅ Đã đăng nhập
  }

  console.warn("🔒 Chặn truy cập vì chưa đăng nhập.");
  return res.status(401).json({
    success: false,
    message: "❌ Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục."
  });
}

function requireRole(roles = []) {
  return (req, res, next) => {
    const user = req.session?.user;
    if (!user) {
      console.warn("🚫 Truy cập bị chặn do chưa đăng nhập.");
      return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
    }

    if (!roles.includes(user.role)) {
      console.warn(`🚫 Truy cập bị chặn: Role '${user.role}' không nằm trong [${roles.join(", ")}]`);
      return res.status(403).json({
        success: false,
        message: "🚫 Bạn không có quyền truy cập chức năng này."
      });
    }

    next();
  };
}

module.exports = {
  protect,
  requireRole
};
