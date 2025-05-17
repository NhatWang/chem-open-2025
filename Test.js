const path = require("path");
const nodemailer = require("nodemailer");
const generateReceiptPDF = require("./utils/generateReceiptPDF");

const testUser = {
  fullName: "Nguyễn Văn A",
  email: "huynhminhdungmcl@gmail.com",
  mssv: "22123456",
  phone: "0912345678",
  amount: 220000,
  paymentCode: "CHEMO1234",
  paymentStatus: "paid",
  noidung: ["Đơn nam", "Đôi nam nữ"]
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lch.hh.khtn@gmail.com",
    pass: "odgk dqfh pagg reng" // App ***HIDDEN***
  }
});

async function sendTestMail(user) {
  const pdfPath = await generateReceiptPDF(user);

  const htmlContent = `
    <p>Thân chào bạn <strong>${user.fullName}</strong>,</p>

    <p>Lời đầu tiên, BTC xin gửi lời cảm ơn đến bạn đã dành thời gian quan tâm và đăng ký tham gia <strong>GIẢI CẦU LÔNG CHEM-OPEN</strong>. Sự ủng hộ của bạn là động lực giúp chúng mình ngày càng hoàn thiện và phấn đấu để mang đến nhiều hơn các hoạt động bổ ích và ý nghĩa.</p>

    <h3>📅 Thông tin Giải đấu:</h3>
    <ul>
      <li><strong>Ngày bốc thăm:</strong> 18h00 ngày 04/06/2025 (Trực tuyến - BTC sẽ thông báo cụ thể sau)</li>
      <li><strong>Ngày thi đấu:</strong> 07, 08/06/2025</li>
      <li><strong>Địa điểm:</strong> Sân cầu lông Aquaminton (1458 Đ. Hoài Thanh, P.14, Q.8, TP.HCM)</li>
    </ul>

    <h4>📌 Lưu ý:</h4>
    <p>Để đảm bảo thông tin được cập nhật nhanh chóng và hỗ trợ kịp thời, bạn vui lòng tham gia nhóm Zalo của Giải đấu tại đường link sau:<br/>
    👉 <a href="https://zalo.me/g/gknpiy901" target="_blank">https://zalo.me/g/gknpiy901</a></p>

    <p>Nếu bạn có bất kỳ thắc mắc, đừng ngần ngại liên hệ với BTC qua email này hoặc qua Fanpage của chúng mình nhé.</p>

    <p>Hẹn gặp bạn tại giải đấu và chúc bạn sẽ có phong độ tốt nhất tại Giải cầu lông CHEM-OPEN!</p>

    <p>Thân mến,<br/>
    BCH Liên chi Hội khoa Hoá học.</p>
  `;

  const mailOptions = {
    from: '"BAN TỔ CHỨC CHEM-OPEN NĂM 2025" <lch.hh.khtn@gmail.com>',
    to: user.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: htmlContent,
    attachments: [
      {
        filename: `Biên nhận thanh toán Chem-Open - ${user.mssv}.pdf`,
        path: path.resolve(pdfPath)
      }
    ]
  };

  await transporter.sendMail(mailOptions);
  console.log("✅ Đã gửi email test xác nhận đến:", user.email);
}

sendTestMail(testUser).catch(err => {
  console.error("❌ Lỗi khi test gửi email:", err);
});
