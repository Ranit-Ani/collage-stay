const SibApiV3Sdk = require("sib-api-v3-sdk");

// Brevo's transactional email API sends over plain HTTPS (a normal outbound
// web request), unlike SMTP which needs a raw socket connection on ports like
// 587/465. Many hosting platforms — including Render's free tier — block or
// throttle those SMTP ports to prevent spam abuse, which is the most likely
// reason emails never sent when this used nodemailer+SMTP. The API approach
// avoids that class of problem entirely.
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKeyAuth = defaultClient.authentications["api-key"];
apiKeyAuth.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Sends an email via the Brevo Transactional Email API.
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    name: process.env.EMAIL_FROM_NAME || "CollegeStay",
    email: process.env.EMAIL_USER,
  };
  sendSmtpEmail.to = [{ email: to }];

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent to ${to}`, data.messageId);
  } catch (err) {
    console.error("Failed to send email via Brevo API:");
    console.error("Status:", err.response?.status);
    console.error("Body:", err.response?.body);
    console.error("Message:", err.message);
    throw err; // preserve throw-on-failure so callers' error handling still works
  }
};

module.exports = sendEmail;