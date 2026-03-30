// scripts/generate-assets.js
// Usage: node scripts/generate-assets.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// ─── Icon SVG (1024×1024) ───────────────────────────────────────────────────
// White rounded card with a blue person silhouette + accent dot grid
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5B8CFF"/>
      <stop offset="100%" stop-color="#3A6DE8"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F0F4FF"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>

  <!-- Card -->
  <rect x="192" y="248" width="640" height="528" rx="56" fill="url(#card)" opacity="0.97"/>

  <!-- Avatar circle -->
  <circle cx="362" cy="430" r="88" fill="#5B8CFF" opacity="0.15"/>
  <circle cx="362" cy="408" r="52" fill="#5B8CFF"/>
  <!-- Shoulders arc -->
  <path d="M242 560 Q242 488 362 488 Q482 488 482 560" fill="#5B8CFF"/>

  <!-- Text lines (name + meta) -->
  <rect x="524" y="380" width="220" height="28" rx="14" fill="#5B8CFF" opacity="0.9"/>
  <rect x="524" y="424" width="160" height="20" rx="10" fill="#A0B8FF" opacity="0.8"/>
  <rect x="524" y="458" width="180" height="20" rx="10" fill="#A0B8FF" opacity="0.6"/>

  <!-- Tag chips -->
  <rect x="524" y="496" width="76" height="24" rx="6" fill="#EEF3FF"/>
  <rect x="610" y="496" width="76" height="24" rx="6" fill="#EEF3FF"/>

  <!-- Divider -->
  <rect x="228" y="552" width="568" height="2" rx="1" fill="#EBEBEB"/>

  <!-- Log lines -->
  <circle cx="262" cy="596" r="10" fill="#5B8CFF" opacity="0.3"/>
  <rect x="288" y="588" width="280" height="16" rx="8" fill="#EBEBEB"/>
  <circle cx="262" cy="636" r="10" fill="#5B8CFF" opacity="0.2"/>
  <rect x="288" y="628" width="200" height="16" rx="8" fill="#EBEBEB"/>

  <!-- Accent dot bottom-right -->
  <circle cx="742" cy="708" r="14" fill="#5B8CFF" opacity="0.5"/>
  <circle cx="786" cy="708" r="14" fill="#5B8CFF" opacity="0.3"/>
</svg>
`.trim();

// ─── Splash SVG (1284×2778) ─────────────────────────────────────────────────
const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#7AA8FF"/>
      <stop offset="100%" stop-color="#5B8CFF"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1284" height="2778" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1100" cy="300" r="320" fill="#FFFFFF" opacity="0.05"/>
  <circle cx="200" cy="2500" r="260" fill="#FFFFFF" opacity="0.05"/>
  <circle cx="642" cy="1389" r="480" fill="#FFFFFF" opacity="0.04"/>

  <!-- Icon card (mini) -->
  <rect x="542" y="1060" width="200" height="200" rx="44" fill="#FFFFFF" opacity="0.2"/>
  <circle cx="642" cy="1130" r="36" fill="#FFFFFF" opacity="0.9"/>
  <path d="M574 1240 Q574 1196 642 1196 Q710 1196 710 1240" fill="#FFFFFF" opacity="0.9"/>

  <!-- App name "Karte" -->
  <text
    x="642"
    y="1340"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="96"
    font-weight="700"
    fill="#FFFFFF"
    text-anchor="middle"
    letter-spacing="6"
  >Karte</text>

  <!-- Tagline -->
  <text
    x="642"
    y="1420"
    font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-size="36"
    font-weight="400"
    fill="#FFFFFF"
    opacity="0.8"
    text-anchor="middle"
    letter-spacing="1"
  >大切な人のことを、もっと覚えていよう</text>
</svg>
`.trim();

async function generate() {
  // Icon 1024×1024
  const iconPath = path.join(assetsDir, 'icon.png');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(iconPath);
  console.log(`✓ icon.png  → ${iconPath}`);

  // Adaptive icon (Android foreground): same design, no rounded clip
  const adaptivePath = path.join(assetsDir, 'adaptive-icon.png');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(adaptivePath);
  console.log(`✓ adaptive-icon.png  → ${adaptivePath}`);

  // Splash 1284×2778
  const splashPath = path.join(assetsDir, 'splash.png');
  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile(splashPath);
  console.log(`✓ splash.png  → ${splashPath}`);

  // Favicon 48×48
  const faviconPath = path.join(assetsDir, 'favicon.png');
  await sharp(Buffer.from(iconSvg))
    .resize(48, 48)
    .png()
    .toFile(faviconPath);
  console.log(`✓ favicon.png → ${faviconPath}`);

  console.log('\nAll assets generated successfully.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
