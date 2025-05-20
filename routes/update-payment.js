const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const nodemailer = require("nodemailer");
const path = require("path");
const generateReceiptPDF = require("../utils/generateReceiptPDF");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.MONGODB_URI) {
  throw new Error("❌ Thiếu biến môi trường: EMAIL_USER, EMAIL_PASS hoặc MONGODB_URI.");
}

mongoose.connect(process.env.MONGODB_URI);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  timeout: 15000,
});

async function sendConfirmationEmail(user, pdfBuffer) {
  const htmlContent = `
  <div style="font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #000;">
    <p>Thân chào bạn <strong>${user.fullName}</strong>,</p>

   <p>Lời đầu tiên, BTC xin gửi lời cảm ơn đến bạn đã dành thời gian quan tâm và đăng ký tham gia <strong style="color: #0b5394;">GIẢI CẦU LÔNG CHEM-OPEN</strong>. Sự ủng hộ của bạn là động lực giúp chúng mình ngày càng hoàn thiện và phấn đấu để mang đến nhiều hơn các hoạt động bổ ích và ý nghĩa.</p>

    <h3 style="font-size: 16px;">Dưới đây, chúng mình xin gửi bạn một số thông tin về Giải đấu:</h3>
    <ol style="padding-left: 20px; font-size: 14px;">
    <li>
      <strong>Ngày bốc thăm</strong><br />
      - Thời gian: 18h00 ngày 04/06/2025<br />
      - Hình thức: Trực tuyến (BTC sẽ thông báo cụ thể sau)
    </li>
    <li style="margin-top: 8px;">
      <strong>Ngày tiến hành giải đấu</strong><br />
      - Thời gian: Ngày 07, 08/06/2025<br />
      - Địa điểm: Sân cầu lông <strong>Aquaminton</strong> (1458 Đ. Hoài Thanh, Phường 14, Quận 8, TP. Hồ Chí Minh)
    </li>
  </ol>

    <h4 style="font-size: 16px;">Lưu ý:</h4>
    <p>Để đảm bảo thông tin được cập nhật nhanh chóng và hỗ trợ kịp thời, bạn vui lòng tham gia <strong>nhóm Zalo của Giải đấu</strong> tại đường link sau:<br/>
    👉 <a href="https://zalo.me/g/gknpiy901" target="_blank">https://zalo.me/g/gknpiy901</a></p>

    <p>Nếu bạn có bất kỳ thắc mắc, đừng ngần ngại liên hệ với BTC qua email này hoặc Fanpage của chúng mình.</p>

    <p>Hẹn gặp bạn tại giải đấu và chúc bạn sẽ có phong độ tốt nhất tại Giải cầu lông CHEM-OPEN!</p>

    <p>Thân mến,<br/>
    BCH Liên chi Hội khoa Hoá học.</p>

    <hr style="margin-top: 30px; margin-bottom: 15px; border: none; border-top: 1px solid #ccc;" />
    <div style="text-align: center; font-size: 25px; color: #000;">
      <p><strong>__________________________________</strong></p>
      <img src="cid:logoLCH" alt="Logo BCH" style="width: 200px; margin-bottom: 10px;" />
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
    from: `BAN TỔ CHỨC CHEM-OPEN NĂM 2025 <${process.env.EMAIL_USER}>`,
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
        path: path.resolve(__dirname, "../public/images/chemopen/lch.png"),
        cid: "logoLCH"
      },
    ]
  };

  try {
  await transporter.sendMail(mailOptions);
  console.log(`📧 Đã gửi email xác nhận đến: ${user.email}`);
} catch (err) {
  if (err.code === 'ETIMEDOUT') {
    console.error("⏱️ Gửi email bị timeout sau 15 giây.");
  } else {
    console.error(`❌ Gửi email lỗi tới ${user.email}:`, err);
  }
}
}

async function sendConfirmationEmailToPartner(partner, mainUser, pdfBuffer) {
  const htmlContent = `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #000;">
      <p>Thân chào bạn <strong>${partner.fullName}</strong>,</p>
      <p>Chúng mình xin thông báo bạn đã được đăng ký làm đồng đội cùng với <strong>${mainUser.fullName}</strong> trong <strong style="color: #0b5394;">GIẢI CẦU LÔNG CHEM-OPEN 2025</strong>.</p>
      <h3 style="font-size: 16px;">Dưới đây, chúng mình xin gửi bạn một số thông tin về Giải đấu:</h3>
    <ol style="padding-left: 20px; font-size: 14px;">
    <li>
      <strong>Ngày bốc thăm</strong><br />
      - Thời gian: 18h00 ngày 04/06/2025<br />
      - Hình thức: Trực tuyến (BTC sẽ thông báo cụ thể sau)
    </li>
    <li style="margin-top: 8px;">
      <strong>Ngày tiến hành giải đấu</strong><br />
      - Thời gian: Ngày 07, 08/06/2025<br />
      - Địa điểm: Sân cầu lông <strong>Aquaminton</strong> (1458 Đ. Hoài Thanh, Phường 14, Quận 8, TP. Hồ Chí Minh)
    </li>
  </ol>

    <h4 style="font-size: 16px;">Lưu ý:</h4>
    <p>Để đảm bảo thông tin được cập nhật nhanh chóng và hỗ trợ kịp thời, bạn vui lòng tham gia <strong>nhóm Zalo của Giải đấu</strong> tại đường link sau:<br/>
    👉 <a href="https://zalo.me/g/gknpiy901" target="_blank">https://zalo.me/g/gknpiy901</a></p>

    <p>Nếu bạn có bất kỳ thắc mắc, đừng ngần ngại liên hệ với BTC qua email này hoặc Fanpage của chúng mình.</p>

    <p>Hẹn gặp bạn tại giải đấu và chúc bạn sẽ có phong độ tốt nhất tại Giải cầu lông CHEM-OPEN!</p>

    <p>Thân mến,<br/>
    BCH Liên chi Hội khoa Hoá học.</p>

    <hr style="margin-top: 30px; margin-bottom: 15px; border: none; border-top: 1px solid #ccc;" />
    <div style="text-align: center; font-size: 25px; color: #000;">
      <p><strong>__________________________________</strong></p>
      <img src="cid:logoLCH" alt="Logo BCH" style="width: 200px; margin-bottom: 10px;" />
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
    from: `BAN TỔ CHỨC CHEM-OPEN NĂM 2025 <${process.env.EMAIL_USER}>`,
    to: partner.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: htmlContent,
    attachments: [
      {
        filename: `${mainUser.paymentCode} - Biên nhận thanh toán Giải đấu Chem - Open 2025.pdf`,
        content: pdfBuffer,
      },
        {
        filename: "lch.png",
        path: path.resolve(__dirname, "../public/images/chemopen/lch.png"),
        cid: "logoLCH"
      },
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email xác nhận cho partner: ${partner.email}`);
  } catch (err) {
    console.error(`❌ Lỗi gửi email cho partner ${partner.email}:`, err);
  }
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
    // Lấy dữ liệu cũ trước khi cập nhật để kiểm tra sự thay đổi
    const currentData = await Registration.findOne({ paymentCode });

    if (!currentData) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký." });
    }

    // Nếu trạng thái không thay đổi, không cần cập nhật lại DB
    if (currentData.paymentStatus === paymentStatus) {
      return res.json({ success: true, message: `⚠️ Trạng thái đã là '${paymentStatus}', không cần cập nhật.` });
    }

    // Cập nhật
    const updated = await Registration.findOneAndUpdate(
      { paymentCode },
      { $set: { paymentStatus }, $unset: { expireAt: "" } },
      { new: true }
    );

    // Nếu trạng thái mới là "paid", gửi email
    if (paymentStatus === "paid") {
      try {
        const pdfBuffer = await generateReceiptPDF(updated);
        await sendConfirmationEmail(updated, pdfBuffer);

        if (updated.partnerInfo?.email) {
          await sendConfirmationEmailToPartner(updated.partnerInfo, updated, pdfBuffer);
        }
      } catch (err) {
        console.error(`❌ Gửi email lỗi:`, err);
        return res.status(500).json({ success: false, message: "Đã cập nhật trạng thái nhưng lỗi khi gửi email." });
      }
    }

    return res.json({ success: true, message: "✅ Cập nhật trạng thái thành công." });
  } catch (err) {
    console.error("❌ Lỗi cập nhật trạng thái:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
});

router.post("/send-partner-mail", async (req, res) => {
  const { paymentCode } = req.body;
  const reg = await Registration.findOne({ paymentCode });

  if (!reg || reg.paymentStatus !== "paid" || !reg.partnerInfo?.email) {
    return res.status(400).json({ success: false, message: "Không hợp lệ." });
  }

  try {
    const pdfBuffer = await generateReceiptPDF(reg);
    await sendConfirmationEmailToPartner(reg.partnerInfo, reg, pdfBuffer);
    return res.json({ success: true, message: `✅ Đã gửi mail cho partner ${reg.partnerInfo.email}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Lỗi khi gửi mail cho partner." });
  }
});

router.post("/resend-mail", async (req, res) => {
  const { paymentCode } = req.body;

  if (!paymentCode) {
    return res.status(400).json({ success: false, message: "Thiếu mã thanh toán." });
  }

  try {
    const registration = await Registration.findOne({ paymentCode });

    if (!registration) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn đăng ký." });
    }

    if (registration.paymentStatus !== "paid") {
      return res.status(400).json({ success: false, message: "Chỉ gửi lại email cho đơn đã thanh toán." });
    }

    const pdfBuffer = await generateReceiptPDF(registration);
    await sendConfirmationEmail(registration, pdfBuffer);
    if (registration.partnerInfo?.email) {
      await sendConfirmationEmailToPartner(registration.partnerInfo, registration, pdfBuffer);
    }

    return res.json({ success: true, message: `✅ Đã gửi lại email cho ${registration.email}` });
  } catch (err) {
    console.error(`❌ Lỗi khi gửi lại email cho ${paymentCode}:`, err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ khi gửi lại email." });
  }
});

module.exports = router;
