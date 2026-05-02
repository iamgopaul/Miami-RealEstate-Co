import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOgPng } from "../src/og-image.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const png = await getOgPng();
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(Buffer.from(png));
}
