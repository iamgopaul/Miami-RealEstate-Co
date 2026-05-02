import type { Lead } from "./sheets.js";
import { esc } from "./utils.js";

export async function sendTelegramAlert(lead: Lead): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const time = new Date(lead.timestamp).toLocaleString("en-US", {
    timeZone:  "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const location = [lead.city, lead.zip].filter(v => v && v !== "—").join(", ") || "—";

  const text = [
    `<b>— REVARA REALTY —</b>`,
    `<i>South Florida Luxury Real Estate</i>`,
    ``,
    `<b>New Inquiry Received</b>`,
    `<code>─────────────────────</code>`,
    `<b>Name</b>       ${esc(lead.name)}`,
    `<b>Email</b>      <a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>`,
    `<b>Phone</b>      <a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>`,
    `<b>Location</b>   ${esc(location)}`,
    `<b>Budget</b>     ${esc(lead.budget)}`,
    `<b>Timeline</b>   ${esc(lead.timeline)}`,
    `<code>─────────────────────</code>`,
    `<i>${esc(time)} EST</i>`,
  ].join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram error ${res.status}: ${body}`);
  }
}

