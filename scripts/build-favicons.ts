import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { createIco } from "./ico.ts";

export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <!-- Mask for split-flap side hinge notches -->
    <mask id="flap-notch-mask">
      <rect width="128" height="128" fill="#ffffff" />
      <rect x="0" y="61.5" width="6" height="5" rx="1.5" fill="#000000" />
      <rect x="122" y="61.5" width="6" height="5" rx="1.5" fill="#000000" />
    </mask>
  </defs>

  <!-- Base Enamel Plate (Carbón base #151a17) with Hairline border (#2d3a33) -->
  <rect x="4" y="4" width="120" height="120" rx="16" fill="#151a17" stroke="#2d3a33" stroke-width="2.5" mask="url(#flap-notch-mask)" />

  <!-- Top Flap Plate (Placa #1c231f with subtle top sheen) -->
  <path d="M4 20 C4 11 11 4 20 4 L108 4 C117 4 124 11 124 20 L124 62 L4 62 Z" fill="#1c231f" mask="url(#flap-notch-mask)" />
  <path d="M4 20 C4 11 11 4 20 4 L108 4 C117 4 124 11 124 20 L124 62 L4 62 Z" fill="#ffffff" opacity="0.06" mask="url(#flap-notch-mask)" />

  <!-- Bottom Flap Plate (#161c18 with bottom fold crease) -->
  <path d="M4 66 L124 66 L124 108 C124 117 117 124 108 124 L20 124 C11 124 4 117 4 108 Z" fill="#161c18" mask="url(#flap-notch-mask)" />
  <line x1="14" y1="116" x2="114" y2="116" stroke="#0e1310" stroke-width="3" stroke-linecap="round" opacity="0.6" />

  <!-- Clock Outer Ring in Quote Amber (#ffb020): Diameter 90px -->
  <circle cx="64" cy="64" r="45" fill="none" stroke="#ffb020" stroke-width="10" />

  <!-- 12 o'clock tick mark -->
  <line x1="64" y1="23" x2="64" y2="31" stroke="#ffb020" stroke-width="6" stroke-linecap="round" />

  <!-- Minute Hand: 12:00 in Enamel Cream (#f2ead8) -->
  <line x1="64" y1="62" x2="64" y2="31" stroke="#f2ead8" stroke-width="9" stroke-linecap="round" />

  <!-- Hour Hand: 8:00 (jornada de 8h) in Quote Amber (#ffb020) -->
  <line x1="64" y1="66" x2="38" y2="79" stroke="#ffb020" stroke-width="10" stroke-linecap="round" />

  <!-- Center Pivot Rivet: Signal Red (#e8482e) with Cream Core (#fff3ec) -->
  <circle cx="64" cy="64" r="8" fill="#e8482e" />
  <circle cx="64" cy="64" r="3" fill="#fff3ec" />

  <!-- Mechanical Split Hinge Line (slits across plate and dial) -->
  <rect x="0" y="62.5" width="128" height="3" fill="#0d110f" />
  <line x1="4" y1="62" x2="124" y2="62" stroke="#28332d" stroke-width="1" opacity="0.9" />

  <!-- Side Hinge Pins -->
  <circle cx="1.5" cy="64" r="2.5" fill="#3a483f" />
  <circle cx="126.5" cy="64" r="2.5" fill="#3a483f" />
</svg>`;

// Write public/favicon.svg
writeFileSync("public/favicon.svg", FAVICON_SVG);
console.log("Written public/favicon.svg");

// Render PNGs for ICO (16x16, 32x32, 48x48)
const sizes = [16, 32, 48];
const icoImages: { width: number; height: number; data: Buffer }[] = [];

for (const size of sizes) {
  const resvg = new Resvg(FAVICON_SVG, {
    fitTo: { mode: "width", value: size },
  });
  const pngBuffer = Buffer.from(resvg.render().asPng());
  icoImages.push({ width: size, height: size, data: pngBuffer });
  writeFileSync(`scripts/final-${size}.png`, pngBuffer);
}

// Also render 180x180 for Apple Touch Icon
const resvg180 = new Resvg(FAVICON_SVG, {
  fitTo: { mode: "width", value: 180 },
});
const png180 = Buffer.from(resvg180.render().asPng());
writeFileSync("public/apple-touch-icon.png", png180);
console.log("Written public/apple-touch-icon.png");

// Build and write public/favicon.ico
const icoBuffer = createIco(icoImages);
writeFileSync("public/favicon.ico", icoBuffer);
console.log("Written public/favicon.ico (multi-res 16, 32, 48)");
