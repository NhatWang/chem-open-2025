require("dotenv").config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: process.env.SENDGRID_FROM, // Gửi tới chính mình để verify
  from: {
    email: process.env.SENDGRID_FROM,
    name: "BAN TỔ CHỨC CHEM-OPEN NĂM 2025"
  },
  subject: 'Test SendGrid Integration',
  html: '<strong>Email này xác nhận cấu hình SendGrid thành công.</strong>',
};

sgMail.send(msg)
  .then(() => console.log("📧 Email test đã gửi thành công"))
  .catch(err => console.error("❌ Lỗi khi gửi mail:", err.response?.body || err));
