import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Webhook } from "svix";
import { Resend } from "resend";

const FROM  = process.env.RESEND_FROM    ?? "Revara Realty · No Reply <team@revararealty.com>";
const OWNER = process.env.OWNER_EMAIL    ?? "revara.realty@outlook.com";
const SECRET = process.env.RESEND_WEBHOOK_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  // Verify the request is from Resend — reject if secret is not configured
  if (!SECRET) return res.status(500).json({ ok: false, error: "Webhook secret not configured" });
  try {
    const wh = new Webhook(SECRET);
    wh.verify(JSON.stringify(req.body), {
      "svix-id":        req.headers["svix-id"] as string,
      "svix-timestamp": req.headers["svix-timestamp"] as string,
      "svix-signature": req.headers["svix-signature"] as string,
    });
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid signature" });
  }

  const { type, data } = req.body as { type: string; data: { from?: string; subject?: string } };
  if (type !== "email.received" || !data?.from) return res.status(200).json({ ok: true });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false });

  const resend = new Resend(key);
  await resend.emails.send({
    from:    FROM,
    to:      data.from,
    replyTo: OWNER,
    subject: "Your message was not received — Revara Realty",
    html:    autoReplyHtml((data.subject ?? "(no subject)").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")),
  });

  return res.json({ ok: true });
}

function autoReplyHtml(originalSubject: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Message Not Received — Revara Realty</title>
</head>
<body style="margin:0;padding:0;background:#e8e8e8;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:48px 16px 56px;">
      <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0" role="presentation">

        <!-- ── HEADER ── -->
        <tr><td style="background:#000000;border-radius:16px 16px 0 0;padding:44px 48px 36px;text-align:center;">
          <img src="https://revararealty.com/media/logo/revara-realty-tab-logo.png"
               alt="Revara Realty" width="90" height="90"
               style="display:block;margin:0 auto 20px;border-radius:14px;"/>
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;">
            REVARA <span style="color:#C0C0C0;">REALTY</span>
          </p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.40);">
            Luxury Real Estate
          </p>
        </td></tr>

        <!-- Silver accent bar -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#888,#C0C0C0,#888);"></td></tr>

        <!-- ── BODY ── -->
        <tr><td style="background:#ffffff;padding:48px 52px 40px;">

          <p style="margin:0 0 32px;font-size:13px;color:#999999;letter-spacing:0.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:#0a0a0a;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
            Your message was not received.
          </h1>

          <p style="margin:0 0 20px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            Thank you for reaching out to <strong style="font-weight:600;">Revara Realty</strong>. This email address (<em>team@revararealty.com</em>) is unmonitored and does not accept incoming messages.
          </p>

          <p style="margin:0 0 36px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            To ensure your inquiry reaches our team, please contact us directly at:
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                 style="background:#f7f7f7;border-left:3px solid #C0C0C0;border-radius:0 8px 8px 0;margin-bottom:36px;">
            <tr><td style="padding:20px 24px;">
              <a href="mailto:${OWNER}" style="font-size:16px;font-weight:700;color:#0a0a0a;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                ${OWNER}
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 4px;font-size:14px;color:#999999;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            Original subject: <em>${originalSubject}</em>
          </p>

          <!-- Signature -->
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:36px;">
            <tr>
              <td style="border-left:2px solid #C0C0C0;padding-left:16px;">
                <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.04em;">
                  The Revara Realty Team
                </p>
                <p style="margin:0;font-size:12px;color:#888888;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.06em;text-transform:uppercase;">
                  South Florida Luxury Real Estate
                </p>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- ── FOOTER ── -->
        <tr><td style="background:#0a0a0a;border-radius:0 0 16px 16px;padding:0;text-align:center;overflow:hidden;">
          <img src="https://revararealty.com/og-image.png" alt="Revara Realty" width="580"
               style="display:block;width:100%;max-width:580px;border:0;"/>
          <div style="padding:24px 40px 28px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.70);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              Miami, Florida 33172
            </p>
            <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.45);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <a href="mailto:${OWNER}" style="color:rgba(255,255,255,0.45);text-decoration:none;">${OWNER}</a>
            </p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.22);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              &copy; 2025 Revara Realty. All rights reserved.
            </p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
