function generateMainHTML(fullName) {
  return `
  <div style="font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #000;">
    <p>Thân chào bạn <strong>${fullName}</strong>,</p>

    <p>Lời đầu tiên, BTC xin gửi lời cảm ơn đến bạn đã dành thời gian quan tâm và đăng ký tham gia <strong style="color: #0b5394;">GIẢI CẦU LÔNG CHEM-OPEN</strong>. Sự ủng hộ của bạn là động lực giúp chúng mình ngày càng hoàn thiện và phấn đấu để mang đến nhiều hơn các hoạt động bổ ích và ý nghĩa.</p>

    <h3 style="font-size: 16px;">Dưới đây, chúng mình xin gửi bạn một số thông tin về Giải đấu:</h3>
    <ol style="padding-left: 20px; font-size: 14px;">
      <li><strong>Ngày bốc thăm</strong><br />- Thời gian: 18h00 ngày 04/06/2025<br />- Hình thức: Trực tuyến (BTC sẽ thông báo cụ thể sau)</li>
      <li style="margin-top: 8px;"><strong>Ngày tiến hành giải đấu</strong><br />- Thời gian: Ngày 07, 08/06/2025<br />- Địa điểm: Sân cầu lông <strong>Aquaminton</strong> (1458 Đ. Hoài Thanh, P.14, Q.8, TP.HCM)</li>
    </ol>

    <h4 style="font-size: 16px;">Lưu ý:</h4>
    <p>Tham gia <strong>nhóm Zalo của Giải đấu</strong> để nhận thông báo:<br/>
    👉 <a href="https://zalo.me/g/gknpiy901" target="_blank">https://zalo.me/g/gknpiy901</a></p>

    <p>Mọi thắc mắc, vui lòng liên hệ BTC qua email này hoặc Fanpage.</p>
    <p>Hẹn gặp bạn tại giải đấu và chúc bạn sẽ có phong độ tốt nhất tại CHEM-OPEN!</p>

    <p>Thân mến,<br/>BCH Liên chi Hội khoa Hoá học.</p>

    <hr style="margin-top: 30px; margin-bottom: 15px; border: none; border-top: 1px solid #ccc;" />
    <div style="text-align: center; font-size: 25px; color: #000;">
      <p><strong>__________________________________</strong></p>
      <img src="https://chem-open2025.id.vn/public/images/chemopen/lch.png" alt="Logo BCH" style="width: 200px;" />
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
}

function generatePartnerHTML(partnerName, mainName) {
  return `
  <div style="font-family: 'Times New Roman', Times, serif; font-size: 15px; color: #000;">
    <p>Thân chào bạn <strong>${partnerName}</strong>,</p>

    <p>Chúng mình xin thông báo bạn đã được đăng ký làm đồng đội cùng với <strong>${mainName}</strong> trong <strong style="color: #0b5394;">GIẢI CẦU LÔNG CHEM-OPEN 2025</strong>.</p>

    <h3 style="font-size: 16px;">Dưới đây là một số thông tin:</h3>
    <ol style="padding-left: 20px; font-size: 14px;">
      <li><strong>Ngày bốc thăm</strong><br />- Thời gian: 18h00 ngày 04/06/2025<br />- Hình thức: Trực tuyến (BTC sẽ thông báo cụ thể sau)</li>
      <li style="margin-top: 8px;"><strong>Ngày tiến hành giải đấu</strong><br />- Thời gian: Ngày 07, 08/06/2025<br />- Địa điểm: Sân cầu lông <strong>Aquaminton</strong> (1458 Đ. Hoài Thanh, P.14, Q.8, TP.HCM)</li>
    </ol>

    <h4 style="font-size: 16px;">Lưu ý:</h4>
    <p>Tham gia <strong>nhóm Zalo của Giải đấu</strong> để nhận thông báo:<br/>
    👉 <a href="https://zalo.me/g/gknpiy901" target="_blank">https://zalo.me/g/gknpiy901</a></p>

    <p>Mọi thắc mắc, vui lòng liên hệ BTC qua email này hoặc Fanpage.</p>
    <p>Hẹn gặp bạn tại giải đấu và chúc bạn sẽ có phong độ tốt nhất tại CHEM-OPEN!</p>

    <p>Thân mến,<br/>BCH Liên chi Hội khoa Hoá học.</p>

    <hr style="margin-top: 30px; margin-bottom: 15px; border: none; border-top: 1px solid #ccc;" />
    <div style="text-align: center; font-size: 25px; color: #000;">
      <p><strong>__________________________________</strong></p>
      <img src="https://chem-open2025.id.vn/public/images/chemopen/lch.png" alt="Logo BCH" style="width: 200px;" />
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
}

function buildMainMailOptions(user, pdfBuffer) {
  return {
    to: user.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: generateMainHTML(user.fullName),
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: `${user.paymentCode} - Biên nhận thanh toán giải đấu CHEM-OPEN 2025.pdf`,
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };
}

function buildPartnerMailOptions(partner, mainUser, pdfBuffer) {
  return {
    to: partner.email,
    subject: "THƯ XÁC NHẬN ĐĂNG KÝ THAM GIA GIẢI CẦU LÔNG CHEM-OPEN 2025",
    html: generatePartnerHTML(partner.fullName, mainUser.fullName),
    attachments: [
      {
        content: pdfBuffer.toString("base64"),
        filename: `${mainUser.paymentCode} - Biên nhận thanh toán giải đấu CHEM-OPEN 2025.pdf`,
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };
}

module.exports = {
  generateMainHTML,
  generatePartnerHTML,
  buildMainMailOptions,
  buildPartnerMailOptions
};