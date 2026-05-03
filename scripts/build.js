import { readFileSync, writeFileSync, copyFileSync } from "fs";

if (process.env.COMING_SOON === "true") {
  copyFileSync("frontend/coming-soon.html", "frontend/index.html");
  console.log("build: coming soon mode");
} else {
  const url = (process.env.SITE_URL ?? "").replace(/\/$/, "");
  if (!url) {
    console.error("SITE_URL env var is not set — og:image and canonical URLs will be broken");
    process.exit(1);
  }
  let html = readFileSync("frontend/index-main.html", "utf8");
  html = html.replaceAll("__SITE_URL__", url);
  writeFileSync("frontend/index.html", html);
  console.log(`build: replaced __SITE_URL__ → ${url}`);
}
