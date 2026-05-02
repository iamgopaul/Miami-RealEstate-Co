import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appendLead, type Lead } from "../src/sheets.js";
import { sendConfirmation, sendOwnerAlert } from "../src/email.js";
import { sendTelegramAlert } from "../src/telegram.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const body = req.body as Partial<Lead>;
  const name  = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();

  if (!name || !phone || !email) {
    return res.status(400).json({ ok: false, error: "name, phone, and email are required" });
  }

  const lead: Lead = {
    name, email, phone,
    city:      body.city?.trim()  || "—",
    zip:       body.zip?.trim()   || "—",
    budget:    body.budget        || "—",
    timeline:  body.timeline      || "—",
    timestamp: new Date().toISOString(),
    source:    (req.headers.referer as string) || "direct",
  };

  try {
    await appendLead(lead);
  } catch (err) {
    console.error("Sheet error:", err);
  }

  Promise.allSettled([
    sendConfirmation(lead),
    sendOwnerAlert(lead),
    sendTelegramAlert(lead),
  ]).then(results => {
    results.forEach((r, i) => {
      const label = ["confirmation email", "owner alert", "telegram"][i];
      if (r.status === "rejected") console.error(`${label} failed:`, r.reason);
    });
  });

  return res.json({ ok: true });
}
