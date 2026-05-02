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

  const row = (label: string, value: string) =>
    `<b>${label}</b>\n${value}`;

  const text = [
    `🏙 <b>REVARA REALTY</b>`,
    `<i>New Inquiry — ${esc(time)} EST</i>`,
    ``,
    `🪪 <b>Reference</b>\n<code>${esc(lead.id)}</code>`,
    ``,
    row(`👤 Name`,     esc(lead.name)),
    row(`📧 Email`,    `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>`),
    row(`📞 Phone`,    `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>`),
    row(`📍 Location`, esc(location)),
    row(`💰 Budget`,   esc(lead.budget)),
    row(`🗓 Timeline`, esc(lead.timeline)),
  ].join("\n");

  const chatIds = chatId.split(",").map(id => id.trim()).filter(Boolean);

  const results = await Promise.allSettled(chatIds.map(async id => {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: id, text, parse_mode: "HTML" }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      const parsed = JSON.parse(body);
      const hint = parsed?.description?.includes("chat not found")
        ? ` — user ${id} must open the bot on Telegram and press Start before messages can be delivered.`
        : "";
      throw new Error(`Telegram error ${res.status} for chat ${id}${hint}`);
    }
  }));

  const failed = results.filter(r => r.status === "rejected");
  if (failed.length === results.length) {
    throw new Error(failed.map(r => (r as PromiseRejectedResult).reason?.message ?? r).join("; "));
  }
  for (const r of failed) {
    console.error("Telegram partial failure:", (r as PromiseRejectedResult).reason?.message);
  }
}

