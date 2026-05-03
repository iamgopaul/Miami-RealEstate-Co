import { readFileSync, writeFileSync, copyFileSync } from "fs";

if (process.env.LAUNCH === "true") {
  const url = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  if (!url) {
    console.error("SITE_URL env var is not set — og:image and canonical URLs will be broken");
    process.exit(1);
  }
  let html = readFileSync("frontend/index-main.html", "utf8");
  html = html.replaceAll("__SITE_URL__", url);
  writeFileSync("frontend/index.html", html);
  console.log(`build: LIVE — replaced __SITE_URL__ → ${url}`);
} else {
  copyFileSync("frontend/coming-soon.html", "frontend/index.html");
  console.log("build: coming soon mode");
}
