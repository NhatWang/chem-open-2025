const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true },
  phone:    { type: String, required: true },
  gender:   { type: String, enum: ["Nam", "Nữ"] },
  khoa:     String,
  lop:      String,
  mssv:     { type: String, required: true },
  noidung:  [String],
  amount:   Number,
  paymentMethod: String,
  paymentCode:   { type: String, required: true, unique: true },
  paymentStatus: { type: String, default: "pending" },
  expireAt: {
    type: Date,
    index: { expires: 0 }
  },
  drawResult: {
  type: Object,
  default: {}
},
  partnerInfo: {
    fullName: String,
    email: String,
    phone: String,
    gender:   { type: String, enum: ["Nam", "Nữ"] },
    khoa: String,
    lop: String,
    mssv: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);