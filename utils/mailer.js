const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  timeout: 20000,
});

async function sendMail(mailOptions) {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Gửi thành công:", info.response);
    return true;
  } catch (err) {
    console.error("❌ Lỗi gửi mail:", err.message || err);
    return false;
  }
}

module.exports = sendMail;