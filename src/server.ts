import { appendLead, type Lead } from "./sheets.js";
import { sendConfirmation, sendOwnerAlert } from "./email.js";
import { sendTelegramAlert } from "./telegram.js";
import { generateLeadId, validateSubmission } from "./utils.js";
import { getOgPng } from "./og-image.js";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");

// Read HTML once at startup, inject env vars so the file stays a clean template
let htmlSrc = await Bun.file(join(ROOT, "frontend/index.html")).text();

const pixelId = process.env.META_PIXEL_ID ?? "";
if (pixelId) {
  htmlSrc = htmlSrc.replaceAll("YOUR_PIXEL_ID", pixelId);
} else {
  console.warn("META_PIXEL_ID not set — Meta Pixel will not fire");
}

const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
if (siteUrl) {
  htmlSrc = htmlSrc.replaceAll("__SITE_URL__", siteUrl);
} else {
  console.warn("SITE_URL not set — og:image will not resolve correctly");
}

const HTML         = htmlSrc;
const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8" };

// Extensions the server will serve as static assets
const STATIC_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico"]);

const PORT = Number(process.env.PORT) || 3000;

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png",  ".webp": "image/webp",
  ".gif": "image/gif",  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // ── Landing page ──
    if (pathname === "/" && req.method === "GET") {
      return new Response(HTML, { headers: HTML_HEADERS });
    }

    // ── robots.txt — allow all crawlers including facebookexternalhit ──
    if (pathname === "/robots.txt" && req.method === "GET") {
      return new Response("User-agent: *\nAllow: /\n", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // ── OG image ──
    if (pathname === "/og-image.png" && req.method === "GET") {
      const png = await getOgPng();
      return new Response(png as unknown as BodyInit, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // ── Static assets (images, favicon, etc.) ──
    if (req.method === "GET") {
      const dot = pathname.lastIndexOf(".");
      const ext = dot >= 0 ? pathname.slice(dot).toLowerCase() : "";
      if (STATIC_EXTS.has(ext)) {
        const file = Bun.file(join(ROOT, "frontend", pathname.slice(1)));
        if (await file.exists()) {
          return new Response(file, {
            headers: {
              "Content-Type": MIME[ext] ?? "application/octet-stream",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    // ── Lead submission ──
    if (url.pathname === "/submit" && req.method === "POST") {
      let body: Partial<Lead>;

      try {
        body = await req.json();
      } catch {
        return json({ ok: false, error: "Invalid JSON" }, 400);
      }

      const name  = body.name?.trim();
      const phone = body.phone?.trim();
      const email = body.email?.trim();

      if (!name || !phone || !email) {
        return json({ ok: false, error: "name, phone, and email are required" }, 400);
      }

      const invalid = validateSubmission(name, phone, email);
      if (invalid.length) {
        return json({ ok: false, error: "invalid_fields", fields: invalid }, 400);
      }

      const lead: Lead = {
        id:        generateLeadId(),
        name,
        email,
        phone,
        city:      body.city?.trim()     || "—",
        zip:       body.zip?.trim()      || "—",
        budget:    body.budget           || "—",
        timeline:  body.timeline         || "—",
        timestamp: new Date().toISOString(),
        source:    req.headers.get("referer") || "direct",
      };

      try {
        await appendLead(lead);
      } catch (err) {
        console.error("Sheet error:", err);
        console.log("Lead (fallback):", lead);
      }

      // Fire all notifications in parallel — never block the user response
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

      return json({ ok: true });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Running at http://localhost:${server.port}`);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
