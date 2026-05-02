const fs = require("fs");

const url = (process.env.SITE_URL ?? "").replace(/\/$/, "");
if (!url) {
  console.error("SITE_URL env var is not set — og:image and canonical URLs will be broken");
  process.exit(1);
}

let html = fs.readFileSync("index.html", "utf8");
html = html.replaceAll("__SITE_URL__", url);
fs.writeFileSync("index.html", html);
console.log(`build: replaced __SITE_URL__ → ${url}`);
