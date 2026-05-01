import type { Lead } from "./sheets";

/**
 * Sends a WhatsApp notification to the owner via Twilio.
 *
 * Required env vars (all optional — if missing, silently skips):
 *   TWILIO_ACCOUNT_SID   — from console.twilio.com
 *   TWILIO_AUTH_TOKEN    — from console.twilio.com
 *   TWILIO_WHATSAPP_FROM — your Twilio WhatsApp number, e.g. +14155238886
 *   OWNER_WHATSAPP       — your personal WhatsApp number, e.g. +13055551234
 *
 * To get started quickly, use the Twilio Sandbox:
 *   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
 *   Set TWILIO_WHATSAPP_FROM to the sandbox number (+14155238886)
 *   and text "join <sandbox-keyword>" from your phone once to activate it.
 */
export async function sendWhatsAppAlert(lead: Lead): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM;
  const to    = process.env.OWNER_WHATSAPP;

  if (!sid || !token || !from || !to) return; // not configured — skip silently

  const time = new Date(lead.timestamp).toLocaleString("en-US", {
    timeZone:  "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const location = [lead.city, lead.zip].filter(v => v && v !== "—").join(", ") || "—";

  const body = [
    `*New Lead — Miami Properties*`,
    ``,
    `*Name:* ${lead.name}`,
    `*Email:* ${lead.email}`,
    `*Phone:* ${lead.phone}`,
    `*Location:* ${location}`,
    `*Budget:* ${lead.budget}`,
    `*Timeline:* ${lead.timeline}`,
    ``,
    `_${time} EST_`,
  ].join("\n");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:+${from.replace(/\D/g, "")}`,
        To:   `whatsapp:+${to.replace(/\D/g, "")}`,
        Body: body,
      }).toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twilio error ${res.status}: ${text}`);
  }
}
