import fs from "node:fs";
import path from "node:path";

function ensureDistOutput() {
  const distDir = path.resolve(process.cwd(), "dist");
  const outputPublicDir = path.resolve(process.cwd(), ".output", "public");
  const publicDir = path.resolve(process.cwd(), "public");

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Copy .output/public contents into dist
  if (fs.existsSync(outputPublicDir)) {
    fs.cpSync(outputPublicDir, distDir, { recursive: true });
  }

  // 2. Copy public directory contents into dist
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true });
  }

  // 3. Locate entry CSS and JS in dist/assets
  const assetsDir = path.join(distDir, "assets");
  let cssFile = "";
  let jsEntry = "";

  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    cssFile = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || "";
    jsEntry = assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js")) || "";
  }

  // 4. Generate standard HTML SPA shell
  const htmlContent = `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <title>KONEKTA — Serviços em São Tomé e Príncipe</title>
    <meta name="description" content="Plataforma segura para contratar profissionais em São Tomé e Príncipe." />
    <meta property="og:title" content="KONEKTA" />
    <meta property="og:description" content="Serviços de confiança em São Tomé e Príncipe." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" />
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
    <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  </head>
  <body>
    <div id="root"></div>
    ${jsEntry ? `<script type="module" src="/assets/${jsEntry}"></script>` : ""}
  </body>
</html>`;

  fs.writeFileSync(path.join(distDir, "index.html"), htmlContent, "utf8");
  fs.writeFileSync(path.join(distDir, "200.html"), htmlContent, "utf8");
  fs.writeFileSync(path.join(distDir, "404.html"), htmlContent, "utf8");

  const builtFiles = fs.readdirSync(distDir);
  console.log(
    `[postbuild] Generated dist/ artifacts successfully (${builtFiles.length} top-level entries):`,
  );
  for (const item of builtFiles) {
    console.log(`  - dist/${item}`);
  }
}

ensureDistOutput();
