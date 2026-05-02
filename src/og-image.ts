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
  const logo = readFileSync(join(process.cwd(), "media/logo/revara-realty-logo.png"));
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
    <!-- Invert white-bg logo to silver marks, derive alpha from luminance so bg becomes transparent -->
    <filter id="logoExtract" color-interpolation-filters="sRGB" x="-2%" y="-2%" width="104%" height="104%">
      <feComponentTransfer result="inverted">
        <feFuncR type="linear" slope="-1" intercept="1"/>
        <feFuncG type="linear" slope="-1" intercept="1"/>
        <feFuncB type="linear" slope="-1" intercept="1"/>
      </feComponentTransfer>
      <feColorMatrix in="inverted" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0.33 0.33 0.33 0 -0.15"
        result="withAlpha"/>
      <feComponentTransfer in="withAlpha">
        <feFuncA type="linear" slope="2" intercept="0"/>
      </feComponentTransfer>
    </filter>
  </defs>

  <image href="${heroUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#overlay)"/>
  <rect width="1200" height="630" fill="url(#bottomFade)"/>
  <rect x="0" y="0" width="1200" height="5" fill="#C0C0C0"/>

  <image href="${logoUri}" x="390" y="10" width="420" height="420"
         filter="url(#logoExtract)"
         preserveAspectRatio="xMidYMid meet"/>

  <text x="600" y="474"
    font-family="Inter, Arial, Helvetica, sans-serif"
    font-size="52" font-weight="800" letter-spacing="8"
    text-anchor="middle">
    <tspan fill="#ffffff">REVARA</tspan><tspan fill="#D0D0D0"> REALTY</tspan>
  </text>

  <rect x="440" y="493" width="320" height="2" fill="#C0C0C0" opacity="0.55"/>

  <text x="600" y="522"
    font-family="Inter, Arial, Helvetica, sans-serif"
    font-size="18" font-weight="700" fill="#ffffff"
    text-anchor="middle" letter-spacing="9">SOUTH FLORIDA REAL ESTATE</text>

  <text x="600" y="560"
    font-family="Inter, Arial, Helvetica, sans-serif"
    font-size="15" font-weight="700" fill="rgba(255,255,255,0.85)"
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
