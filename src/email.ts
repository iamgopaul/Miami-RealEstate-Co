import { Resend } from "resend";
import type { Lead } from "./sheets.js";
import { esc } from "./utils.js";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const FROM  = process.env.RESEND_FROM  ?? "Revara Realty <revera.realty@outlook.com>";
const OWNER = process.env.OWNER_EMAIL  ?? "revera.realty@outlook.com";

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendConfirmation(lead: Lead): Promise<void> {
  const resend = client();
  if (!resend) { console.warn("RESEND_API_KEY not set — skipping confirmation email"); return; }
  await resend.emails.send({
    from:    FROM,
    to:      lead.email,
    subject: "Thank You for Reaching Out — Revara Realty",
    html:    confirmationHtml(lead),
  });
}

export async function sendOwnerAlert(lead: Lead): Promise<void> {
  const resend = client();
  if (!resend) { console.warn("RESEND_API_KEY not set — skipping owner alert"); return; }
  await resend.emails.send({
    from:    FROM,
    to:      OWNER,
    subject: `New Lead: ${lead.name} · ${lead.budget} · ${lead.timeline}`,
    html:    ownerHtml(lead),
  });
}

// ── Email templates ───────────────────────────────────────────────────────────

function confirmationHtml(lead: Lead): string {
  const location = [lead.city, lead.zip].filter(v => v && v !== "—").join(", ");
  const firstName = esc(lead.name).split(" ")[0];
  const summary = [
    lead.budget   !== "—" ? summaryRow("Budget",   lead.budget)   : "",
    lead.timeline !== "—" ? summaryRow("Timeline", lead.timeline) : "",
    location              ? summaryRow("Location", location)      : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Thank You — Revara Realty</title>
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

        <!-- ── LETTER BODY ── -->
        <tr><td style="background:#ffffff;padding:48px 52px 40px;">

          <p style="margin:0 0 32px;font-size:13px;color:#999999;letter-spacing:0.06em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <h1 style="margin:0 0 24px;font-size:28px;font-weight:400;color:#0a0a0a;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">
            Dear ${firstName},
          </h1>

          <p style="margin:0 0 20px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            On behalf of everyone at <strong style="font-weight:600;">Revara Realty</strong>, thank you sincerely for reaching out to us. We are truly honored by your interest and look forward to helping you find your ideal property in South Florida.
          </p>

          <p style="margin:0 0 20px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            Your inquiry has been received and a dedicated member of our team will personally reach out to you within <strong style="font-weight:600;">24 hours</strong> to discuss your vision in detail, answer any questions you may have, and present an exclusive, curated selection of properties tailored precisely to your goals.
          </p>

          <p style="margin:0 0 36px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            In the meantime, please do not hesitate to reply directly to this email with any additional preferences or details that may assist us in serving you better. We are committed to providing you with a seamless, world-class real estate experience from our very first conversation.
          </p>

          ${summary ? `
          <!-- Inquiry summary -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                 style="background:#f7f7f7;border-left:3px solid #C0C0C0;border-radius:0 8px 8px 0;margin-bottom:36px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#888888;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                Your Inquiry Summary
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${summary}</table>
            </td></tr>
          </table>` : ""}

          <p style="margin:0 0 8px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            We look forward to speaking with you very soon.
          </p>

          <p style="margin:0 0 4px;font-size:16px;color:#2c2c2c;line-height:1.85;font-family:Georgia,'Times New Roman',serif;">
            Warmly,
          </p>

          <!-- Signature -->
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
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
              <a href="mailto:revara.realty@outlook.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">revara.realty@outlook.com</a>
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

function ownerHtml(lead: Lead): string {
  const time = new Date(lead.timestamp).toLocaleString("en-US", {
    timeZone:  "America/New_York",
    dateStyle: "long",
    timeStyle: "short",
  });

  const location = [lead.city, lead.zip].filter(v => v && v !== "—").join(", ") || "—";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#e8e8e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:48px 16px 56px;">
      <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0" role="presentation">

        <!-- ── HEADER ── -->
        <tr><td style="background:#000000;border-radius:16px 16px 0 0;padding:36px 48px 28px;text-align:center;">
          <img src="https://revararealty.com/media/logo/revara-realty-tab-logo.png"
               alt="Revara Realty" width="80" height="80"
               style="display:block;margin:0 auto 16px;border-radius:12px;"/>
          <p style="margin:0;font-size:20px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;">
            REVARA <span style="color:#C0C0C0;">REALTY</span>
          </p>
          <p style="margin:6px 0 0;font-size:10px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.38);">
            New Inquiry Received
          </p>
        </td></tr>

        <!-- Silver accent bar -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#888,#C0C0C0,#888);"></td></tr>

        <!-- ── LEAD DETAILS ── -->
        <tr><td style="background:#ffffff;padding:36px 48px 28px;">

          <p style="margin:0 0 24px;font-size:12px;color:#999999;letter-spacing:0.06em;text-transform:uppercase;">
            Received · ${esc(time)} EST
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${dataRow("Full Name",       lead.name)}
            ${dataRow("Email Address",   lead.email,  `mailto:${lead.email}`)}
            ${dataRow("Phone Number",    lead.phone,  `tel:${lead.phone}`)}
            ${dataRow("Location",        location)}
            ${dataRow("Budget Range",    lead.budget)}
            ${dataRow("Purchase Timeline", lead.timeline)}
          </table>

        </td></tr>

        <!-- ── SOURCE TAG ── -->
        <tr><td style="background:#f4f4f4;border-top:1px solid #e0e0e0;padding:16px 48px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#aaaaaa;letter-spacing:0.08em;text-transform:uppercase;">
            Source: ${esc(lead.source)} &nbsp;&middot;&nbsp; revararealty.com
          </p>
        </td></tr>

        <!-- ── FOOTER ── -->
        <tr><td style="background:#0a0a0a;border-radius:0 0 16px 16px;padding:0;text-align:center;overflow:hidden;">
          <img src="https://revararealty.com/og-image.png" alt="Revara Realty" width="580"
               style="display:block;width:100%;max-width:580px;border:0;"/>
          <div style="padding:20px 40px 24px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.70);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              Miami, Florida 33172
            </p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <a href="mailto:revara.realty@outlook.com" style="color:rgba(255,255,255,0.45);text-decoration:none;">revara.realty@outlook.com</a>
            </p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Template helpers ──────────────────────────────────────────────────────────

function summaryRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;border-bottom:1px solid #eeeeee;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#aaaaaa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${label}&nbsp;&nbsp;</span>
      <span style="font-size:14px;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${esc(value)}</span>
    </td>
  </tr>`;
}

function dataRow(label: string, value: string, href?: string): string {
  const val = href
    ? `<a href="${href}" style="color:#1a1a1a;text-decoration:none;font-size:16px;font-weight:600;">${esc(value)}</a>`
    : `<span style="color:#1a1a1a;font-size:16px;font-weight:600;">${esc(value)}</span>`;
  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;">
      <span style="display:block;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#aaaaaa;margin-bottom:3px;">${label}</span>
      ${val}
    </td>
  </tr>`;
}
