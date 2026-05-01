import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { join } from "path";

let ready = false;
let cache: Uint8Array | null = null;

async function ensureInit() {
  if (ready) return;
  const wasmPath = join(
    import.meta.dir,
    "../node_modules/@resvg/resvg-wasm/index_bg.wasm"
  );
  const wasmBuffer = await Bun.file(wasmPath).arrayBuffer();
  await initWasm(wasmBuffer);
  ready = true;
}

// Load hero.jpg once at module init and encode as base64 for SVG embedding
const heroBytes = await Bun.file(join(import.meta.dir, "../hero.jpg")).arrayBuffer();
const heroB64   = Buffer.from(heroBytes).toString("base64");
const heroDataUri = `data:image/jpeg;base64,${heroB64}`;

function buildSvg(heroUri: string): string {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- Dark cinematic overlay matching the landing page -->
    <linearGradient id="overlay" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%"   stop-color="#000510" stop-opacity="0.78"/>
      <stop offset="40%"  stop-color="#000a1c" stop-opacity="0.52"/>
      <stop offset="100%" stop-color="#000510" stop-opacity="0.82"/>
    </linearGradient>
    <!-- Bottom fade so bottom bar blends cleanly -->
    <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="60%"  stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <!-- Hero photo background -->
  <image href="${heroUri}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>

  <!-- Cinematic dark overlay -->
  <rect width="1200" height="630" fill="url(#overlay)"/>
  <rect width="1200" height="630" fill="url(#bottomFade)"/>

  <!-- Orange top bar -->
  <rect x="0" y="0" width="1200" height="5" fill="#FF6B35"/>

  <!-- Logo mark (skyline icon) — centered -->
  <g transform="translate(546, 148) scale(3)">
    <rect x="1"  y="25" width="5"  height="10" rx="1" fill="#FF6B35"/>
    <rect x="7"  y="18" width="5"  height="17" rx="1" fill="#FF6B35"/>
    <rect x="14" y="10" width="7"  height="25" rx="1" fill="#FF6B35"/>
    <rect x="22" y="15" width="5"  height="20" rx="1" fill="#FF6B35" opacity="0.85"/>
    <rect x="28" y="21" width="5"  height="14" rx="1" fill="#FF6B35" opacity="0.65"/>
    <rect x="0"  y="35" width="36" height="1"          fill="#FF6B35" opacity="0.35"/>
  </g>

  <!-- MIAMI -->
  <text x="600" y="310"
    font-family="Inter, sans-serif"
    font-size="88" font-weight="900" fill="#ffffff"
    text-anchor="middle" letter-spacing="18">MIAMI</text>

  <!-- PROPERTIES -->
  <text x="600" y="406"
    font-family="Inter, sans-serif"
    font-size="88" font-weight="900" fill="#FF6B35"
    text-anchor="middle" letter-spacing="18">PROPERTIES</text>

  <!-- Divider -->
  <rect x="520" y="428" width="160" height="2" fill="#FF6B35" opacity="0.45"/>

  <!-- Tagline -->
  <text x="600" y="472"
    font-family="Arial, Helvetica, sans-serif"
    font-size="20" fill="rgba(255,255,255,0.72)"
    text-anchor="middle" letter-spacing="9">LUXURY REAL ESTATE</text>

  <!-- Locations -->
  <text x="600" y="580"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17" fill="rgba(255,255,255,0.45)"
    text-anchor="middle" letter-spacing="3">BRICKELL  ·  MIAMI BEACH  ·  CORAL GABLES</text>

  <!-- Orange bottom bar -->
  <rect x="0" y="625" width="1200" height="5" fill="#FF6B35"/>
</svg>`;
}

const fontBuffer = await Bun.file(
  join(import.meta.dir, "../fonts/Inter-Bold.ttf")
).arrayBuffer();

export async function getOgPng(): Promise<Uint8Array> {
  if (cache) return cache;
  await ensureInit();
  const svg   = buildSvg(heroDataUri);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      loadSystemFonts: false,
      fontBuffers: [new Uint8Array(fontBuffer)],
    },
  });
  cache = resvg.render().asPng();
  return cache;
}
