import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFileSync } from "fs";
import { join } from "path";

let wasmReady = false;
let cache: Uint8Array | null = null;
let heroDataUri: string | null = null;
let fontData: Uint8Array | null = null;

async function ensureInit() {
  if (wasmReady) return;
  const wasm = readFileSync(join(process.cwd(), "node_modules/@resvg/resvg-wasm/index_bg.wasm"));
  await initWasm(wasm);
  wasmReady = true;
}

function ensureAssets() {
  if (heroDataUri && fontData) return;
  const hero = readFileSync(join(process.cwd(), "media/page-wallpapers/hero.jpg"));
  heroDataUri = `data:image/jpeg;base64,${hero.toString("base64")}`;
  fontData = new Uint8Array(readFileSync(join(process.cwd(), "fonts/Inter-Bold.ttf")));
}

function buildSvg(heroUri: string): string {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="overlay" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.80"/>
      <stop offset="40%"  stop-color="#000000" stop-opacity="0.50"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
    </linearGradient>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="60%"  stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <image href="${heroUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#overlay)"/>
  <rect width="1200" height="630" fill="url(#bottomFade)"/>
  <rect x="0" y="0" width="1200" height="5" fill="#C0C0C0"/>

  <g transform="translate(546, 148) scale(3)">
    <rect x="1"  y="25" width="5"  height="10" rx="1" fill="#C0C0C0"/>
    <rect x="7"  y="18" width="5"  height="17" rx="1" fill="#C0C0C0"/>
    <rect x="14" y="10" width="7"  height="25" rx="1" fill="#C0C0C0"/>
    <rect x="22" y="15" width="5"  height="20" rx="1" fill="#C0C0C0" opacity="0.85"/>
    <rect x="28" y="21" width="5"  height="14" rx="1" fill="#C0C0C0" opacity="0.65"/>
    <rect x="0"  y="35" width="36" height="1"          fill="#C0C0C0" opacity="0.35"/>
  </g>

  <text x="600" y="310"
    font-family="Inter, sans-serif"
    font-size="88" font-weight="900" fill="#ffffff"
    text-anchor="middle" letter-spacing="18">REVARA</text>

  <text x="600" y="406"
    font-family="Inter, sans-serif"
    font-size="88" font-weight="900" fill="#C0C0C0"
    text-anchor="middle" letter-spacing="18">REALTY</text>

  <rect x="520" y="428" width="160" height="2" fill="#C0C0C0" opacity="0.45"/>

  <text x="600" y="472"
    font-family="Arial, Helvetica, sans-serif"
    font-size="20" fill="rgba(255,255,255,0.72)"
    text-anchor="middle" letter-spacing="9">SOUTH FLORIDA REAL ESTATE</text>

  <text x="600" y="580"
    font-family="Arial, Helvetica, sans-serif"
    font-size="15" fill="rgba(255,255,255,0.45)"
    text-anchor="middle" letter-spacing="2">MIAMI · FORT LAUDERDALE · BOCA RATON · WEST PALM BEACH</text>

  <rect x="0" y="625" width="1200" height="5" fill="#C0C0C0"/>
</svg>`;
}

export async function getOgPng(): Promise<Uint8Array> {
  if (cache) return cache;
  await ensureInit();
  ensureAssets();
  const svg   = buildSvg(heroDataUri!);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      loadSystemFonts: false,
      fontBuffers: [fontData!],
    },
  });
  cache = resvg.render().asPng();
  return cache;
}
