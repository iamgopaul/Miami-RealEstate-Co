import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appendLead, type Lead } from "../src/sheets.js";
import { sendConfirmation, sendOwnerAlert } from "../src/email.js";
import { sendTelegramAlert } from "../src/telegram.js";
import { generateLeadId, validateSubmission } from "../src/utils.js";

// Simple in-memory rate limit: max 3 submissions per IP per 10 minutes
const rateMap = new Map<string, { count: number; reset: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 3) return true;
  entry.count++;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again later." });
  }

  const body = req.body as Partial<Lead>;
  const name  = body.name?.trim();
  const phone = body.phone?.trim();
  const email = body.email?.trim();

  if (!name || !phone || !email) {
    return res.status(400).json({ ok: false, error: "name, phone, and email are required" });
  }

  const invalid = validateSubmission(name, phone, email);
  if (invalid.length) {
    return res.status(400).json({ ok: false, error: "invalid_fields", fields: invalid });
  }

  const lead: Lead = {
    id:        generateLeadId(),
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

  const labels = ["confirmation email", "owner alert", "telegram"];
  const results = await Promise.allSettled([
    sendConfirmation(lead),
    sendOwnerAlert(lead),
    sendTelegramAlert(lead),
  ]);
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`${labels[i]} failed:`, msg);
      errors.push(`${labels[i]}: ${msg}`);
    }
  });

  return res.json({ ok: true, errors: errors.length ? errors : undefined });
}
