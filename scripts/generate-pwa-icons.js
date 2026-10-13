const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgPath = path.join(__dirname, '..', 'src', 'app', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Copy svg icon as well
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgBuffer);

  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log("Generated icon-192.png");

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log("Generated icon-512.png");

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log("Generated apple-touch-icon.png");

  // 512x512 Maskable Icon with background padding
  const innerIcon = await sharp(svgBuffer)
    .resize(400, 400)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 14, g: 42, b: 34, alpha: 1 } // #0e2a22
    }
  })
    .composite([{ input: innerIcon, gravity: 'centre' }])
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable.png'));
  console.log("Generated icon-maskable.png");

  console.log("All PWA icons generated successfully!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
