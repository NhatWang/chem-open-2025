const sendMail = require("./mailer");
const generateReceiptPDF = require("./generateReceiptPDF");
const { buildMainMailOptions, buildPartnerMailOptions } = require("./mailTemplates");


async function sendConfirmationEmail(registrationDoc) {
  const pdfBuffer = await generateReceiptPDF(registrationDoc);

  const tasks = [sendMail(buildMainMailOptions(registrationDoc, pdfBuffer))];
  let hasPartner = false;

  if (registrationDoc.partnerInfo?.email) {
    tasks.push(sendMail(buildPartnerMailOptions(registrationDoc.partnerInfo, registrationDoc, pdfBuffer)));
    hasPartner = true;
  }

  const results = await Promise.allSettled(tasks);

  const [mainResult, partnerResult] = results;

  if (mainResult.status !== "fulfilled") {
    throw new Error("❌ Không gửi được mail chính");
  }

  if (hasPartner && partnerResult?.status !== "fulfilled") {
    console.warn(
      `⚠️ Không gửi được mail partner đến ${registrationDoc.partnerInfo.email}:`,
      partnerResult?.reason?.message || partnerResult?.reason || "Không rõ lỗi"
    );
  }
}


module.exports = sendConfirmationEmail;
