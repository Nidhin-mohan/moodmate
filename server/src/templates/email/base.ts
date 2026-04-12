/**
 * Shared email shell.
 * Every template calls this with its own `body` HTML — no template
 * needs to repeat the outer layout, fonts, or footer.
 */
export function baseEmail(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MoodMate</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        ${body}

        <!-- Footer -->
        <tr><td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
            You're receiving this because you have a MoodMate account.<br>
            © ${new Date().getFullYear()} MoodMate
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
