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

const SVG = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1829"/>
      <stop offset="100%" stop-color="#080e1a"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#080e1a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#080e1a"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Skyline silhouette -->
  <g fill="#0d1c33">
    <rect x="0"    y="448" width="62"  height="182"/>
    <rect x="48"   y="426" width="50"  height="204"/>
    <rect x="90"   y="404" width="56"  height="226"/>
    <rect x="138"  y="374" width="54"  height="256"/>
    <rect x="186"  y="340" width="66"  height="290"/>
    <rect x="246"  y="292" width="58"  height="338"/>
    <rect x="298"  y="248" width="70"  height="382"/>
    <rect x="358"  y="190" width="86"  height="440"/>
    <rect x="432"  y="268" width="50"  height="362"/>
    <rect x="472"  y="152" width="84"  height="478"/>
    <rect x="544"  y="220" width="60"  height="410"/>
    <rect x="592"  y="166" width="74"  height="464"/>
    <rect x="652"  y="108" width="94"  height="522"/>
    <rect x="730"  y="168" width="68"  height="462"/>
    <rect x="783"  y="120" width="86"  height="510"/>
    <rect x="857"  y="225" width="62"  height="405"/>
    <rect x="906"  y="252" width="76"  height="378"/>
    <rect x="968"  y="302" width="60"  height="328"/>
    <rect x="1016" y="274" width="66"  height="356"/>
    <rect x="1070" y="340" width="58"  height="290"/>
    <rect x="1118" y="368" width="70"  height="262"/>
    <rect x="1178" y="352" width="56"  height="278"/>
    <rect x="1226" y="396" width="84"  height="234"/>
    <rect x="1282" y="418" width="78"  height="212"/>
    <rect x="1348" y="444" width="92"  height="186"/>
  </g>
  <!-- Fade skyline into background -->
  <rect width="1200" height="630" fill="url(#fade)"/>

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
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="88" font-weight="900" fill="#ffffff"
    text-anchor="middle" letter-spacing="18">MIAMI</text>

  <!-- PROPERTIES -->
  <text x="600" y="406"
    font-family="Arial Black, Arial, Helvetica, sans-serif"
    font-size="88" font-weight="900" fill="#FF6B35"
    text-anchor="middle" letter-spacing="18">PROPERTIES</text>

  <!-- Divider -->
  <rect x="520" y="428" width="160" height="2" fill="#FF6B35" opacity="0.35"/>

  <!-- Tagline -->
  <text x="600" y="472"
    font-family="Arial, Helvetica, sans-serif"
    font-size="20" fill="rgba(255,255,255,0.42)"
    text-anchor="middle" letter-spacing="9">LUXURY REAL ESTATE</text>

  <!-- Locations -->
  <text x="600" y="570"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17" fill="rgba(255,255,255,0.22)"
    text-anchor="middle" letter-spacing="3">BRICKELL  ·  MIAMI BEACH  ·  CORAL GABLES</text>

  <!-- Orange bottom bar -->
  <rect x="0" y="625" width="1200" height="5" fill="#FF6B35"/>
</svg>`;

export async function getOgPng(): Promise<Uint8Array> {
  if (cache) return cache;
  await ensureInit();
  const resvg = new Resvg(SVG, { fitTo: { mode: "width", value: 1200 } });
  cache = resvg.render().asPng();
  return cache;
}
