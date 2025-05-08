const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  khoa: String,
  lop: String,
  mssv: String,
  noidung: [String],
  amount: Number,
  paymentMethod: String,
  paymentCode: { type: String, required: true },
  paymentStatus: { type: String, default: "pending" },
  partnerInfo: {
    fullName: String,
    email: String,
    phone: String,
    khoa: String,
    lop: String,
    mssv: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);