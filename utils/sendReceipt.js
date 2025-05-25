const sendMail = require("./mailer");
const generateReceiptPDF = require("./generateReceiptPDF");
const { buildMainMailOptions, buildPartnerMailOptions } = require("./mailTemplates");


async function sendConfirmationEmail(registrationDoc) {
  const pdfBuffer = await generateReceiptPDF(registrationDoc);

  const tasks = [sendMail(buildMainMailOptions(registrationDoc, pdfBuffer))];

  if (registrationDoc.partnerInfo?.email) {
    tasks.push(sendMail(buildPartnerMailOptions(registrationDoc.partnerInfo, registrationDoc, pdfBuffer)));
  }

  const [mainResult, partnerResult] = await Promise.allSettled(tasks);

  if (mainResult.status !== "fulfilled") {
    throw new Error("❌ Không gửi được mail chính");
  }

  if (partnerResult?.status !== "fulfilled") {
    console.warn(`⚠️ Không gửi được mail partner đến ${registrationDoc.partnerInfo.email}:`, partnerResult.reason);
  }
}

module.exports = sendConfirmationEmail;
