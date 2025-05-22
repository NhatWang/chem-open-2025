const mongoose = require("mongoose");
const User = require("../models/User"); // Cập nhật đường dẫn nếu cần
require("dotenv").config({ path: "../.env" });

async function updateFullName() {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await User.updateOne(
    { username: "nnhquang2006" },
    { $set: { fullName: "Nguyễn Nhật Quang" } }
  );

  if (res.modifiedCount > 0) {
    console.log("✅ Đã cập nhật fullName!");
  } else {
    console.log("⚠️ Không tìm thấy người dùng hoặc đã cập nhật rồi.");
  }

  await mongoose.disconnect();
}

updateFullName();