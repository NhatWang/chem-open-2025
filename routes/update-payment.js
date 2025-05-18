const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const nodemailer = require("nodemailer");
const path = require("path");
const generateReceiptPDF = require("../utils/generateReceiptPDF");

mongoose.connect(process.env.MONGODB_URI.replace("<PASSWORD>", process.env.MONGO_PASS));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendConfirmationEmail(user, pdfBuffer) {
  const htmlContent = `
  <div style="font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #000;">
    <p>Thân chào bạn <strong>${user.fullName}</strong>,</p>

    <p>Lời đầu tiên, BTC xin gửi lời cảm ơn đến bạn đã dành thời gian quan tâm và đăng ký tham gia <strong>GIẢI CẦU LÔNG CHEM-OPEN</strong>. Sự ủng hộ của bạn là động lực giúp chúng mình ngày càng hoàn thiện và phấn đấu để mang đến nhiều hơn các hoạt động bổ ích và ý nghĩa.</p>

    <h3 style="font-size: 14px;">📅 Thông tin Giải đấu:</h3>
    <ul>
      <li><strong>Ngày bốc thăm:</strong> 18h00 ngày 04/06/2025 (Trực tuyến - BTC sẽ thông báo cụ thể sau)</li>
      <li><strong>Ngày thi đấu:</strong> 07, 08/06/2025</li>
      <li><strong>Địa điểm:</strong> Sân cầu lông Aquaminton (1458 Đ. Hoài Thanh, P.14, Q.8, TP.HCM)</li>
    </ul>

    <h4 style="font-size: 13px;">📌 Lưu ý:</h4>
    <p>Để đảm bảo thông tin được cập nhật nhanh chóng và hỗ trợ kịp thời, bạn vui lòng tham gia nhóm Zalo của Giải đấu tại:<br/>
    👉 <a href="https://zalo.me/g/gknpiy901" target="_blank">https://zalo.me/g/gknpiy901</a></p>

    <p>Nếu bạn có bất kỳ thắc mắc, đừng ngần ngại liên hệ với BTC qua email này hoặc Fanpage của chúng mình.</p>

    <p>Hẹn gặp bạn tại giải đấu và chúc bạn sẽ có phong độ tốt nhất tại Giải cầu lông CHEM-OPEN!</p>

    <p>Thân mến,<br/>
    BCH Liên chi Hội khoa Hoá học.</p>

    <hr style="margin-top: 30px; margin-bottom: 15px; border: none; border-top: 1px solid #ccc;" />
    <div style="text-align: center;">
      <p><strong>__________________________________</strong></p>
      <img src="cid:logoLCH" alt="Logo BCH" style="width: 90px; margin-bottom: 10px;" />
      <p style="margin: 5px 0; color: #1a73e8;"><strong>Hội sinh viên Việt Nam – TP. Hồ Chí Minh</strong></p>
      <p style="margin: 0; color: #1a73e8;"><strong>Trường Đại học Khoa học Tự nhiên, ĐHQG - HCM</strong></p>
      <p style="margin: 0 0 10px 0; color: #1a73e8;"><strong>BCH Liên chi Hội khoa Hóa học</strong></p>
      <p style="margin: 10px 0 5px 0;"><strong>Fanpage:</strong> 
        <a href="https://www.facebook.com/doankhoa.lienchihoi.hoahoc.khtn/" target="_blank" style="color: #1a73e8; text-decoration: none;">
          Đoàn khoa - Liên Chi Hội khoa Hóa học ĐH.KHTN
        </a>
      </p>
      <p style="margin: 5px 0;"><strong>Hotline:</strong></p>
      <p style="margin: 2px 0;">📞 032 620 8325 (Anh Đạt – Liên chi Hội trưởng)</p>
      <p style="margin: 2px 0;">📞 076 556 1512 (Minh Nhật – Liên chi Hội phó)</p>
      <p style="margin: 2px 0;">📞 079 322 6741 (Trường Thịnh – Liên chi Hội phó)</p>
    </div>
  </div>
`;

  const mailOptions = {
    from: '"BAN TỔ CHỨC CHEM-OPEN NĂM 2025" <lch.hh.khtn@gmail.com>',
    to: user.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: htmlContent,
    attachments: [
      {
        filename: `${user.paymentCode} - Biên nhận thanh toán Giải đấu Chem - Open 2025.pdf`,
        content: pdfBuffer,
      },
        {
        filename: "lch.png",
        path: path.resolve(__dirname, "../images/chemopen/lch.png"),
        cid: "logoLCH"
      },
    ]
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Đã gửi email xác nhận đến: ${user.email}`);
}

router.put("/update-payment", async (req, res) => {
  const { paymentStatus, paymentCode } = req.body;

  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "Thiếu mã thanh toán." });
  }

  const validStatuses = ["pending", "paid", "failed"];
  if (!validStatuses.includes(paymentStatus)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
  }

  try {
    const updated = await Registration.findOneAndUpdate(
      { paymentCode },
      { $set: { paymentStatus }, $unset: { expireAt: "" } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không có thay đổi." });
    }

    if (paymentStatus === "paid") {
      try {
        const pdfBuffer = await generateReceiptPDF(updated);
        await sendConfirmationEmail(updated, pdfBuffer);
      } catch (err) {
        console.error("❌ Gửi email thất bại:", err);
      }
    }

    return res.json({ success: true, message: "✅ Cập nhật trạng thái thành công." });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

module.exports = router;
