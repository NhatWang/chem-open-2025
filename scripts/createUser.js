const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // Đảm bảo đường dẫn đúng
require("dotenv").config({path: "../.env"});

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Đã kết nối MongoDB");

    const username = "nnhquang2006";
    const ***HIDDEN*** = "matkhau123"; // 🔐 Đổi lại sau khi đăng nhập
    const email = "nnhquang2006@gmail.com";
    const mssv = "24147110";

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      console.log("⚠️ Superadmin đã tồn tại.");
    } else {
      const hashed = await bcrypt.hash(***HIDDEN***, 10);
      await User.create({
        username,
        ***HIDDEN***: hashed,
        email,
        mssv,
        role: "superadmin",
        pending: false
      });
      console.log("✅ Tạo tài khoản superadmin thành công!");
    }

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Lỗi tạo superadmin:", err);
    mongoose.disconnect();
  }
}

createSuperAdmin();