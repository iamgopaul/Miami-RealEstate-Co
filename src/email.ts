import { Resend } from "resend";
import type { Lead } from "./sheets";

// Lazy — only instantiated when RESEND_API_KEY is present
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const FROM  = process.env.RESEND_FROM  ?? "Revara Realty <onboarding@resend.dev>";
const OWNER = process.env.OWNER_EMAIL  ?? "joshgopaul91@gmail.com";

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendConfirmation(lead: Lead): Promise<void> {
  const resend = client();
  if (!resend) { console.warn("RESEND_API_KEY not set — skipping confirmation email"); return; }
  await resend.emails.send({
    from:    FROM,
    to:      lead.email,
    subject: "We received your request — Revara Realty",
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
  const summary  = [
    lead.budget   !== "—" ? row("Budget",   lead.budget)   : "",
    lead.timeline !== "—" ? row("Timeline", lead.timeline) : "",
    location              ? row("Location", location)      : "",
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Revara Realty — Request Received</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">

        <!-- Brand header -->
        <tr><td style="background:#080e1a;border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#FF6B35;">&#9650;</p>
          <p style="margin:0;font-size:17px;font-weight:800;letter-spacing:0.13em;text-transform:uppercase;color:#ffffff;">REVARA <span style="color:#FF6B35;">REALTY</span></p>
          <p style="margin:5px 0 0;font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.38);">Luxury Real Estate</p>
        </td></tr>
        <tr><td style="background:#FF6B35;height:3px;"></td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px 40px 32px;">
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#080e1a;letter-spacing:-0.02em;line-height:1.2;">
            We'll be in touch shortly.
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.75;">
            Hi <strong style="color:#080e1a;">${esc(lead.name)}</strong>, thank you for reaching out to Revara Realty.
            One of our advisors will contact you within <strong style="color:#080e1a;">24&nbsp;hours</strong>
            with a curated selection of properties matched to your goals.
          </p>

          ${summary ? `
          <!-- Inquiry summary -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                 style="background:#f8f9fb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:28px;">
            <tr><td style="padding:22px 24px;">
              <p style="margin:0 0 16px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">Your Inquiry</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${summary}</table>
            </td></tr>
          </table>` : ""}

          <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.7;">
            Questions? Simply reply to this email and we'll respond promptly.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f9fb;border-radius:0 0 14px 14px;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 5px;font-size:12px;color:#9ca3af;letter-spacing:0.06em;">
            Miami &nbsp;&middot;&nbsp; Fort Lauderdale &nbsp;&middot;&nbsp; Boca Raton &nbsp;&middot;&nbsp; West Palm Beach
          </p>
          <p style="margin:0;font-size:11px;color:#d1d5db;">&copy; 2025 Revara Realty. All rights reserved.</p>
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
    dateStyle: "medium",
    timeStyle: "short",
  });

  const location = [lead.city, lead.zip].filter(v => v && v !== "—").join(", ") || "—";

  function dataRow(label: string, value: string, href?: string): string {
    const val = href
      ? `<a href="${href}" style="color:#0077B6;text-decoration:none;font-size:15px;">${esc(value)}</a>`
      : `<strong style="color:#111827;font-size:15px;">${esc(value)}</strong>`;
    return `<tr>
      <td style="padding:11px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.07em;">${label}</span><br>${val}
      </td>
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:500px;" cellpadding="0" cellspacing="0" role="presentation">

        <!-- Header -->
        <tr><td style="background:#FF6B35;border-radius:12px 12px 0 0;padding:22px 32px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">New Lead — Revara Realty</p>
          <p style="margin:5px 0 0;font-size:13px;color:rgba(255,255,255,0.78);">${esc(time)} EST</p>
        </td></tr>

        <!-- Data rows -->
        <tr><td style="background:#ffffff;padding:28px 32px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${dataRow("Name",     lead.name)}
            ${dataRow("Email",    lead.email,    `mailto:${lead.email}`)}
            ${dataRow("Phone",    lead.phone,    `tel:${lead.phone}`)}
            ${dataRow("Location", location)}
            ${dataRow("Budget",   lead.budget)}
            ${dataRow("Timeline", lead.timeline)}
          </table>
        </td></tr>

        <!-- Meta -->
        <tr><td style="background:#fff7ed;border:1px solid #fed7aa;border-top:none;border-radius:0 0 12px 12px;padding:14px 32px;">
          <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">Source: ${esc(lead.source)}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;">
      <span style="font-size:13px;color:#9ca3af;">${label}&nbsp;&nbsp;</span>
      <span style="font-size:13px;color:#374151;">${esc(value)}</span>
    </td>
  </tr>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
