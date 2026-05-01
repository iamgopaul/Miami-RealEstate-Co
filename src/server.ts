import { appendLead, type Lead } from "./sheets";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const HTML = Bun.file(join(ROOT, "index.html"));

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
      return new Response(HTML);
    }

    // ── Static assets (images, favicon, etc.) ──
    if (req.method === "GET") {
      const dot = pathname.lastIndexOf(".");
      const ext = dot >= 0 ? pathname.slice(dot).toLowerCase() : "";
      if (STATIC_EXTS.has(ext)) {
        const file = Bun.file(join(ROOT, pathname.slice(1)));
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

      if (!name || !phone) {
        return json({ ok: false, error: "name and phone are required" }, 400);
      }

      const lead: Lead = {
        name,
        phone,
        budget:    body.budget    || "—",
        timeline:  body.timeline  || "—",
        timestamp: new Date().toISOString(),
        source:    req.headers.get("referer") || "direct",
      };

      try {
        await appendLead(lead);
        return json({ ok: true });
      } catch (err) {
        console.error("Sheet error:", err);
        // Still return 200 so the user sees the thank-you — the lead is logged to console
        console.log("Lead (fallback):", lead);
        return json({ ok: true });
      }
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
