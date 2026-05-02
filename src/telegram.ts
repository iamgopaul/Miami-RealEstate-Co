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

  const divider = `─────────────────────`;
  const col = (label: string, value: string) => {
    const key = `${label}:`;
    return key + " ".repeat(Math.max(1, 11 - key.length)) + value;
  };

  const text = [
    `<b>REVARA REALTY</b>`,
    `<code>${divider}</code>`,
    `<i>New Inquiry Received</i>`,
    ``,
    `<code>${[
      divider,
      col("RRID",     lead.id),
      divider,
      col("Name",     lead.name),
      col("Email",    lead.email),
      col("Phone",    lead.phone),
      col("Location", location),
      col("Budget",   lead.budget),
      col("Timeline", lead.timeline),
      divider,
    ].join("\n")}</code>`,
    ``,
    `<i>${esc(time)} EST</i>`,
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

