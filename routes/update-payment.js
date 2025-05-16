const express = require("express");
const router = express.Router();
const { protect } = require('../middlewares/auth');
const Registration = require("../models/Registration");
const nodemailer = require("nodemailer");
const path = require("path");
const { generateReceiptPDF } = require("../utils/generateReceiptPDF");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lch.hh.khtn@gmail.com",
    pass: "odgk dqfh pagg reng" // dùng App password, không dùng pass thường
  }
});

async function sendConfirmationEmail(user, attachmentPath) {
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
    from: '"BAN TỔ CHỨC CHEM-OPEN NĂM 2025" <lch.hh.khtn@gmail.com>',   // 👈 Tên hiển thị người gửi
    to: user.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025", // Subject line
    html: htmlContent,
    attachments: [
      {
        filename: `${data.paymentCode} - Biên nhận thanh toán Giải đấu Chem - Open 2025.pdf`,
        path: path.resolve(__dirname, `../receipts/${data.paymentCode} - Biên nhận thanh toán Giải đấu Chem - Open 2025.pdf`)
      }
    ]
  };
  await transporter.sendMail(mailOptions);
  console.log(`📧 Đã gửi email xác nhận đến: ${user.email}`);
}

router.put("/update-payment", async (req, res) => {
  const { paymentStatus, paymentCode } = req.body;

  // ⚠️ Validate đầu vào
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
      {
        $set: { paymentStatus },
        $unset: { expireAt: "" }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoặc không có thay đổi." });
    }

    // Gửi mail nếu thanh toán thành công
    if (paymentStatus === "paid") {
      try {
        const pdfPath = await generateReceiptPDF(updated);
        await sendConfirmationEmail(updated, pdfPath);
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
