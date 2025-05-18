const fs = require('fs');
const path = require('path');
const generateReceiptPDF = require('../LCH_project/utils/generateReceiptPDF'); // cập nhật đúng path

const dummyData = {
  fullName: "Nguyễn Văn A",
  mssv: "2212345",
  email: "nnhquang2006@gmail.com",
  phone: "0909123456",
  amount: 50000,
  paymentMethod: "bank",
  paymentCode: "CHEMO0123",
  paymentStatus: "paid"
};

(async () => {
  try {
    const pdfBuffer = await generateReceiptPDF(dummyData);
    const outputPath = path.join(__dirname, 'Biên_nhận_mẫu.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log("✅ Đã tạo mẫu biên nhận tại:", outputPath);
  } catch (err) {
    console.error("❌ Lỗi tạo PDF:", err);
  }
})();