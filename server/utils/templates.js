export const forgotHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Password Reset — One Time Code</title>
  </head>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f4f4f4; margin:0; padding:20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="max-width:600px; width:100%; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
      <tr>
        <td style="background:#0b7a57; padding:20px; text-align:center; color:#ffffff;">
          <h1 style="margin:0; font-size:22px;">Smart Bin Application</h1>
        </td>
      </tr>

      <tr>
        <td style="padding:28px;">
          <h2 style="margin:0 0 12px 0; font-size:18px; color:#333;">Password reset — One-time code</h2>

          <p style="margin:0 0 18px 0; color:#555; line-height:1.5; font-size:15px;">
            Hello,
            <br />
            We received a request to reset your password. Use the one-time code below to complete the reset. This code is valid for <strong>{{expiryMinutes}} minutes</strong>.
          </p>

          <div style="margin:22px 0; text-align:center;">
            <div style="display:inline-block; padding:18px 26px; border-radius:8px; background:#f7f9f7; border:1px dashed #e1e7e1;">
              <p style="margin:0 0 8px 0; font-size:13px; color:#777;">Your verification code</p>
              <p style="margin:0; font-family: 'Courier New', Courier, monospace; font-size:28px; letter-spacing:4px; color:#0b7a57;">
                {{otp}}
              </p>
            </div>
          </div>

          <p style="margin:0 0 18px 0; color:#666; font-size:14px; line-height:1.5;">
            If you did not request this, you can safely ignore this email. For security, do not share this code with anyone.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />

          <p style="margin:0; font-size:13px; color:#999;">
            If you have trouble using the code, contact our support at
            <a href="mailto:{{supportEmail}}" style="color:#0b7a57; text-decoration:none;">S-Bin Support</a>.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:14px; text-align:center; background:#fafafa; font-size:12px; color:#bbb;">
          &copy; 2025 Smart Bin Application
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const forgotText = `
Smart Bin Application

Password reset — One-time code

Hello,
We received a request to reset your password. Use the code below to complete the reset. This code is valid for {{expiryMinutes}} minutes.

Code: {{otp}}

If you did not request this, ignore this email.
Support: {{supportEmail}}
`;
