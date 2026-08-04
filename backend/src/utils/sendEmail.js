const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // Brevo uses STARTTLS on 587
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
  // Fail fast instead of hanging if Brevo is unreachable or credentials are wrong —
  // without these, a bad SMTP config can hang a request for minutes.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * Sends an email via Brevo SMTP.
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "CollegeStay <no-reply@collegestay.com>",
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
