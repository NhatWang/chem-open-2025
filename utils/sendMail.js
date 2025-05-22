const nodemailer = require("nodemailer");

// Cấu hình transporter (dùng Gmail hoặc SMTP khác nếu bạn muốn)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Kiểm tra kết nối email khi khởi động
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Không thể kết nối Gmail:", err);
  } else {
    console.log("✅ Gmail sẵn sàng gửi mail!");
  }
});

/**
 * Gửi email
 * @param {Object} options
 * @param {string} options.to - Địa chỉ người nhận
 * @param {string} options.subject - Tiêu đề
 * @param {string} options.html - Nội dung HTML
 */
async function sendMail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"CHEM-OPEN" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = sendMail;
