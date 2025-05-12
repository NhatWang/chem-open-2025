function protect(req, res, next) {
  if (req.session && req.session.user) {
    return next(); // ✅ Đã đăng nhập
  }

  // ❌ Chưa đăng nhập
  res.status(401).json({
    success: false,
    message: "❌ Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục."
  });
}

module.exports = { protect };