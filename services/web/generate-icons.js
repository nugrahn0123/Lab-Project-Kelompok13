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

// Buat PNG placeholder via Canvas (jika tersedia)
try {
  const { createCanvas } = require('canvas');
  [192, 512].forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    // Background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad; ctx.roundRect(0, 0, size, size, size * 0.2); ctx.fill();
    // Tiket
    const tg = ctx.createLinearGradient(0, 0, size, size);
    tg.addColorStop(0, '#f97316'); tg.addColorStop(1, '#fb923c');
    ctx.fillStyle = tg; ctx.roundRect(size*0.15, size*0.28, size*0.7, size*0.44, size*0.06); ctx.fill();
    // W text
    ctx.fillStyle = '#1a1a2e';
    ctx.font = `900 ${size*0.24}px Arial Black`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('W', size*0.55, size*0.5);
    fs.writeFileSync(path.join(outDir, `icon-${size}.png`), canvas.toBuffer('image/png'));
    console.log(`icon-${size}.png dibuat`);
  });
} catch {
  // canvas tidak tersedia — copy SVG sebagai fallback
  console.log('canvas tidak tersedia, menggunakan SVG. Rename ke .png jika diperlukan.');
  fs.copyFileSync(path.join(outDir, 'icon-192.svg'), path.join(outDir, 'icon-192.png'));
  fs.copyFileSync(path.join(outDir, 'icon-512.svg'), path.join(outDir, 'icon-512.png'));
}
console.log('Icons siap di public/icons/');
