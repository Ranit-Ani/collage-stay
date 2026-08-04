const baseWrapper = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>${title}</title></head>
  <body style="margin:0;padding:0;background-color:#f5f6f8;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <tr>
              <td style="background-color:#1f2937;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.3px;">CollegeStay</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#374151;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;">
                &copy; ${new Date().getFullYear()} CollegeStay. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const verificationEmailTemplate = (fullName, verifyUrl) =>
  baseWrapper(
    "Verify your email",
    `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Confirm your email address</h2>
    <p>Hi ${fullName},</p>
    <p>Thanks for signing up on CollegeStay. Please confirm your email address to activate your account.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">Verify Email</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break:break-all;color:#2563eb;">${verifyUrl}</p>
    <p>This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
  `
  );

const passwordResetEmailTemplate = (fullName, resetUrl) =>
  baseWrapper(
    "Reset your password",
    `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Reset your password</h2>
    <p>Hi ${fullName},</p>
    <p>We received a request to reset your CollegeStay password. Click the button below to choose a new one.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break:break-all;color:#2563eb;">${resetUrl}</p>
    <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
  `
  );

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate };
