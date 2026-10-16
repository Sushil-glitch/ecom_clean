const nodemailer = require("nodemailer");
const SystemSetting = require("../models/SystemSetting");

const getTransporter = async () => {
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let host = process.env.SMTP_HOST || "smtp.gmail.com";
  let port = Number(process.env.SMTP_PORT) || 465;
  let secure = String(process.env.SMTP_SECURE).toLowerCase() !== "false";

  try {
    const settings = await SystemSetting.findOne();
    if (settings && settings.smtpUser && settings.smtpPass) {
      user = settings.smtpUser;
      pass = settings.smtpPass;
      host = settings.smtpHost || host;
      port = settings.smtpPort || port;
      secure = settings.smtpSecure !== undefined ? settings.smtpSecure : secure;
    }
  } catch (err) {
    console.error("DB SMTP Settings fetch error:", err.message);
  }

  // Check if credentials are missing or placeholder
  if (
    !user ||
    !pass ||
    user === "your_email@gmail.com" ||
    pass === "your_smtp_app_password"
  ) {
    return null;
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    }),
    from: user,
  };
};

const sendMail = async (to, subject, text, html = null) => {
  try {
    const config = await getTransporter();

    if (!config) {
      console.log(`\n=================================================`);
      console.log(`⚠️ SMTP SKIPPED (No valid credentials configured in DB or .env)`);
      console.log(`📩 TO: ${to}`);
      console.log(`📌 SUBJECT: ${subject}`);
      console.log(`💬 TEXT: ${text}`);
      console.log(`=================================================\n`);
      return { success: false, skipped: true, message: "SMTP credentials not configured." };
    }

    const mailOptions = {
      from: `"E-Commerce Official" <${config.from}>`,
      to,
      subject,
      text,
      html: html || `<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px;"><h2 style="color: #2563eb; margin-top: 0;">${subject}</h2><p style="font-size: 15px; leading: 1.6;">${text}</p><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="font-size: 12px; color: #64748b;">This is an automated notification from E-Commerce Platform. Please do not reply directly to this email.</p></div>`,
    };

    const info = await config.transporter.sendMail(mailOptions);
    console.log(`✅ SMTP Mail Sent Successfully to ${to}! MessageID: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`❌ SMTP Email Delivery Failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendMail;