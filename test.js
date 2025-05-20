const fs = require('fs');
const path = require('path');
const generateReceiptPDF = require('../LCH_project/utils/generateReceiptPDF'); // chỉnh lại đường dẫn nếu cần

const testData = {
  fullName: "Nguyễn Võ Phú Quí",
  mssv: "24147111",
  email: "nvpq2609@gmail.com",
  phone: "0826764327",
  noidung: ["Đơn nam"],
  amount: 70000,
  paymentMethod: "bank",
  paymentCode: "CHEMODDM9",
  paymentStatus: "paid"
};


(async () => {
  try {
    const pdfBuffer = await generateReceiptPDF(testData);
    const outputPath = path.join(__dirname, 'receipt_test.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ PDF đã được tạo thành công tại: ${outputPath}`);
  } catch (error) {
    console.error("❌ Lỗi khi tạo PDF:", error);
  }
})();
