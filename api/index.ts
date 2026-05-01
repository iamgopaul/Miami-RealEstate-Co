import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";
import { join } from "path";

const htmlSrc = readFileSync(join(process.cwd(), "index.html"), "utf-8");

export default function handler(req: VercelRequest, res: VercelResponse) {
  let html = htmlSrc;
  const pixelId = process.env.META_PIXEL_ID ?? "";
  if (pixelId) html = html.replaceAll("YOUR_PIXEL_ID", pixelId);
  const siteUrl = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  if (siteUrl) html = html.replaceAll("__SITE_URL__", siteUrl);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
}
