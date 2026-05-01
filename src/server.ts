import { appendLead, type Lead } from "./sheets";
import { join } from "path";

const HTML = Bun.file(join(import.meta.dir, "../index.html"));

const PORT = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);

    // ── Landing page ──
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(HTML);
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
