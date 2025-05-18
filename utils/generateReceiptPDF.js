const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UTM_Avo = path.resolve(__dirname, '../public/fonts/UTM Avo.ttf');
const UTM_AvoItalic = path.resolve(__dirname, '../public/fonts/UTM AvoItalic.ttf');
const UTM_AvoBoldItalic = path.resolve(__dirname, '../public/fonts/UTM AvoBold_Italic.ttf');
const UTM_AvoBold = path.resolve(__dirname, '../public/fonts/UTM AvoBold.ttf');

async function generateReceiptPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // ===== Logo =====
      const logoPath = path.resolve(process.cwd(), 'public/images/chemopen/Title2.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, (doc.page.width - 400) / 2, 30, { width: 400 });
        doc.moveDown(4);
      }
      doc.moveDown(7);

      // ===== Tiêu đề =====
      doc
        .fontSize(20)
        .font(UTM_AvoBold)
        .fillColor('#1a73e8')
        .text('BIÊN NHẬN THANH TOÁN', { align: 'center' });

      doc
        .moveDown(0.5)
        .fontSize(20)
        .font(UTM_AvoBold)
        .fillColor('#000')
        .text('GIẢI ĐẤU CẦU LÔNG CHEM-OPEN 2025', { align: 'center' });

      doc
        .moveDown(0.3)
        .fontSize(12)
        .font(UTM_AvoItalic)
        .fillColor('#000')
        .text('CHEM-OPEN 2025 BADMINTON TOURNAMENT', { align: 'center' });

      doc.moveDown(1.5);

      // ===== Mã xác minh =====
      const verifyCode = crypto.createHash('sha1').update(data.paymentCode).digest('hex').slice(-6).toUpperCase();
      doc
        .fontSize(10)
        .fillColor('#888')
        .text(`Mã xác minh: ${verifyCode}`, {
          align: 'left',
          continued: false,
          underline: false,
          link: undefined
        });

      doc.moveDown(0.5);

      // ===== Khung thông tin =====
      const labelX = 70;
      const valueX = 250;
      const lineHeight = 22;

      doc.moveDown(1);
      doc.fontSize(13).fillColor('#000');
      const infoStartY = doc.y;

      const boxHeight = lineHeight * 10 + 24;
      doc.roundedRect(50, infoStartY - 15, doc.page.width - 100, boxHeight, 10).stroke('#aaa');

      const drawLine = (label, value, yOffset) => {
        const y = infoStartY + yOffset;
        doc.font(UTM_AvoBold).text(label, labelX, y);
        doc.font(UTM_Avo).text(value, valueX, y);
      };

      drawLine("Họ tên:", data.fullName, 0);
      drawLine("MSSV:", data.mssv, lineHeight);
      drawLine("Email:", data.email, lineHeight * 2);
      drawLine("Số điện thoại:", data.phone, lineHeight * 3);
      drawLine("Nội dung thi đấu:", Array.isArray(data.noidung) ? data.noidung.join(", ") : "—", lineHeight * 4);
      drawLine("Số tiền:", `${data.amount.toLocaleString('vi-VN')} VNĐ`, lineHeight * 5);
      drawLine("Hình thức thanh toán:", data.paymentMethod === 'bank' ? "Chuyển khoản" : "PayPal", lineHeight * 6);
      drawLine("Mã thanh toán:", data.paymentCode, lineHeight * 7);
      drawLine("Thời gian xác nhận:", new Date().toLocaleString("vi-VN"), lineHeight * 8);
      drawLine("Trạng thái:", data.paymentStatus === 'paid' ? "Đã thanh toán" : "Chưa thanh toán", lineHeight * 9);

      doc.moveDown(2);

      // ===== Ghi chú căn giữa tuyệt đối =====
      const noteVN = 'Lưu ý: Đây là biên nhận điện tử. Vui lòng giữ lại để đối chiếu khi cần.';
      const noteEN = 'Note: This is a digital receipt. Please retain it for verification.';

      doc.fontSize(12).font(UTM_AvoBoldItalic);
      const vnWidth = doc.widthOfString(noteVN);
      const xVN = (doc.page.width - vnWidth) / 2;
      doc.text(noteVN, xVN, doc.y, { lineBreak: false });

      doc.moveDown(1.3);
      doc.fontSize(11).font(UTM_AvoItalic);
      const enWidth = doc.widthOfString(noteEN);
      const xEN = (doc.page.width - enWidth) / 2;
      doc.text(noteEN, xEN, doc.y, { lineBreak: false });

      doc.moveDown(3);

      // ===== Ký tên căn giữa theo khối phải =====
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const dateText = `TP. Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}`;

      doc.fontSize(12).font(UTM_AvoItalic);
      const x = 300;
      doc.text(dateText, x, doc.y, { lineBreak: false });

      doc.moveDown(1.5);
      doc.font(UTM_Avo);
      const y = 360;
      doc.text("Trưởng ban Ban Tổ Chức", y, doc.y, { lineBreak: false });

      const seal = path.resolve(process.cwd(), 'public/images/chemopen/stamp.png');
      if (fs.existsSync(seal)) {
        const sealX = 290;
        const sealY = doc.y + 5;
        doc.save(); // 🛡️ Lưu trạng thái hiện tại trước khi xoay
        doc.rotate(8, { origin: [sealX + 65, sealY + 65] }); // 🔄 Xoay dấu 12 độ (có thể điều chỉnh)
        doc.image(seal, sealX, sealY, { width: 130, opacity: 0.4 });
        doc.restore(); // 🔄 Khôi phục trạng thái ban đầu để phần sau không bị nghiêng
      }
      const sign = path.resolve(process.cwd(), 'public/images/chemopen/sign.png');
      if (fs.existsSync(sign)) {
        const t = 330;
        doc.image(sign, t, doc.y - 5, { width: 200 });
        doc.moveDown(2.5);
      }
      doc.moveDown(4);
      doc.fontSize(14).font(UTM_AvoBold);
      const z = 370;
      doc.text("Nguyễn Anh Đạt", z, doc.y, { lineBreak: false });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateReceiptPDF;
