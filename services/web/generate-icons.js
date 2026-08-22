#!/usr/bin/env node
// generate-icons.js — buat icon PNG untuk PWA
// Jalankan: node generate-icons.js
// Output: public/icons/icon-192.png dan icon-512.png

const fs = require('fs');
const path = require('path');

// SVG untuk icon WarTiket
function makeSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#0a0a1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="100%" style="stop-color:#fb923c"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <!-- Tiket shape -->
  <rect x="${size*0.15}" y="${size*0.28}" width="${size*0.7}" height="${size*0.44}" rx="${size*0.06}" fill="url(#accent)"/>
  <!-- Tear line -->
  <line x1="${size*0.35}" y1="${size*0.28}" x2="${size*0.35}" y2="${size*0.72}" stroke="#1a1a2e" stroke-width="${size*0.025}" stroke-dasharray="${size*0.04}"/>
  <!-- W letter -->
  <text x="${size*0.55}" y="${size*0.58}" font-family="Arial Black, sans-serif" font-weight="900" font-size="${size*0.24}" fill="#1a1a2e" text-anchor="middle" dominant-baseline="middle">W</text>
</svg>`;
}

const outDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Simpan SVG (PWABuilder bisa baca SVG juga)
fs.writeFileSync(path.join(outDir, 'icon-192.svg'), makeSVG(192));
fs.writeFileSync(path.join(outDir, 'icon-512.svg'), makeSVG(512));

// Konversi SVG ke PNG menggunakan @resvg/resvg-js
const { Resvg } = require('@resvg/resvg-js');
[192, 512].forEach(size => {
  const svg = makeSVG(size);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const pngData = resvg.render();
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), pngData.asPng());
  console.log(`icon-${size}.png dibuat`);
});
console.log('Icons siap di public/icons/');
