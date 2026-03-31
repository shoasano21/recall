// scripts/generate-assets.js
// Usage: node scripts/generate-assets.js
const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// ─── アイコン SVG (1024×1024) ─────────────────────────────────────────────
// 循環矢印（約270度）+ 大文字「R」
// 矢印：中心(512,512)、半径295px、上中央(12時)→左中央(9時) 時計回り
// arc: start=(512,217) end=(217,512)  large-arc=1 sweep=1
// 矢印先端：end付近の接線に合わせた三角形
function buildIconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.288; // ~295 on 1024
  const sw = size * 0.0098; // ~10px on 1024

  // 開始点：上中央 (cx, cy-r)
  const sx = cx;
  const sy = cy - r;
  // 終端点：左中央 (cx-r, cy)
  const ex = cx - r;
  const ey = cy;

  // 矢印先端（終端の接線方向：左中央では接線が上方向→先端は下を向く）
  // 接線ベクトル at angle=180deg → direction is (0, -1) → arrow tip faces down
  const ah = size * 0.055; // arrowhead height ~56px
  const ab = size * 0.038; // arrowhead base half ~39px
  // 終端での接線（時計回りなので angle=180deg → tangent = (0, -1)）
  // 矢印先端の頂点・左・右
  const tipX = ex;
  const tipY = ey - ah;
  const baseLeft  = `${ex - ab},${ey + ah * 0.3}`;
  const baseRight = `${ex + ab},${ey + ah * 0.3}`;

  const fontSize = size * 0.42;
  const textY = cy + fontSize * 0.36;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4A9AEE"/>
      <stop offset="100%" stop-color="#1A6FDD"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>

  <!-- Circular arrow arc (~270deg, clockwise, start=top, end=left) -->
  <path
    d="M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="${sw}"
    stroke-linecap="round"
  />

  <!-- Arrowhead at end (left-center, pointing downward along tangent) -->
  <polygon
    points="${tipX},${tipY} ${baseLeft} ${baseRight}"
    fill="#FFFFFF"
  />

  <!-- Letter R -->
  <text
    x="${cx}"
    y="${textY}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="#FFFFFF"
    stroke="#FFFFFF"
    stroke-width="${sw}"
    paint-order="stroke fill"
    text-anchor="middle"
    dominant-baseline="auto"
  >R</text>
</svg>`;
}

async function generate() {
  // icon.png 1024×1024
  const iconSvg = buildIconSvg(1024);
  await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png');

  // adaptive-icon.png 1024×1024
  await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // favicon.png 48×48
  const faviconSvg = buildIconSvg(48);
  await sharp(Buffer.from(faviconSvg)).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('\nAll assets generated.');
}

generate().catch((e) => { console.error(e); process.exit(1); });
