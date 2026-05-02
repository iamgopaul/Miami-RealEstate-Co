import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { readFileSync } from "fs";
import { join } from "path";

let wasmReady = false;
let cache: Uint8Array | null = null;
let heroDataUri: string | null = null;
let logoDataUri: string | null = null;
let fontData: Uint8Array | null = null;

async function ensureInit() {
  if (wasmReady) return;
  const wasm = readFileSync(join(process.cwd(), "node_modules/@resvg/resvg-wasm/index_bg.wasm"));
  await initWasm(wasm);
  wasmReady = true;
}

function ensureAssets() {
  if (heroDataUri && logoDataUri && fontData) return;
  const hero = readFileSync(join(process.cwd(), "media/page-wallpapers/hero.jpg"));
  heroDataUri = `data:image/jpeg;base64,${hero.toString("base64")}`;
  const logo = readFileSync(join(process.cwd(), "media/logo/revara-realty-tab-logo.png"));
  logoDataUri = `data:image/png;base64,${logo.toString("base64")}`;
  fontData = new Uint8Array(readFileSync(join(process.cwd(), "fonts/Inter-Bold.ttf")));
}

function buildSvg(heroUri: string, logoUri: string): string {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="overlay" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.72"/>
      <stop offset="40%"  stop-color="#000000" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.80"/>
    </linearGradient>
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%"  stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.65"/>
    </linearGradient>
  </defs>

  <image href="${heroUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#overlay)"/>
  <rect width="1200" height="630" fill="url(#bottomFade)"/>
  <rect x="0" y="0" width="1200" height="5" fill="#C0C0C0"/>

  <image href="${logoUri}" x="370" y="28" width="460" height="460"
         preserveAspectRatio="xMidYMid meet"/>

  <rect x="500" y="505" width="200" height="2" fill="#C0C0C0" opacity="0.40"/>

  <text x="600" y="538"
    font-family="Arial, Helvetica, sans-serif"
    font-size="19" fill="rgba(255,255,255,0.72)"
    text-anchor="middle" letter-spacing="9">SOUTH FLORIDA REAL ESTATE</text>

  <text x="600" y="600"
    font-family="Arial, Helvetica, sans-serif"
    font-size="14" fill="rgba(255,255,255,0.42)"
    text-anchor="middle" letter-spacing="2">MIAMI · FORT LAUDERDALE · BOCA RATON · WEST PALM BEACH</text>

  <rect x="0" y="625" width="1200" height="5" fill="#C0C0C0"/>
</svg>`;
}

export async function getOgPng(): Promise<Uint8Array> {
  if (cache) return cache;
  await ensureInit();
  ensureAssets();
  const svg   = buildSvg(heroDataUri!, logoDataUri!);
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
