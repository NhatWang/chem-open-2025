require("dotenv").config();
const sgMail = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM) {
  throw new Error("❌ Thiếu SENDGRID_API_KEY hoặc SENDGRID_FROM");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMail({ to, subject, html, attachments }) {
  const msg = {
    to,
    from: `"BAN TỔ CHỨC CHEM-OPEN NĂM 2025" <${process.env.SENDGRID_FROM}>`,
    subject,
    html,
    attachments: attachments || []
  };

  try {
    const response = await sgMail.send(msg);
    console.log("📧 SendGrid gửi thành công:", response[0].statusCode);
    return response;
  } catch (err) {
    console.error("❌ Lỗi gửi mail SendGrid:", err.response?.body || err);
    return null;
  }
}

module.exports = sendMail;
