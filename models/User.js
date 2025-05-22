const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  mssv: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  ***HIDDEN***: { type: String, required: true },
  role: { type: String, enum: ["admin", "collab", "superadmin"], required: true },
  pending: { type: Boolean, default: true },
  resetToken: String,
  resetExpires: Date,
  active: { type: Boolean, default: false } // đúng, nhưng không ảnh hưởng update
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.***HIDDEN***);
};

module.exports = mongoose.model("User", userSchema);
