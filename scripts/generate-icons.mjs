import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
const svgPath = join(iconsDir, 'icon.svg');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  // Also generate apple-touch-icon (180x180)
  const appleTouchPath = join(__dirname, '..', 'public', 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('Generated: apple-touch-icon.png');

  // Generate favicon sizes
  const favicon32 = join(__dirname, '..', 'public', 'favicon-32x32.png');
  const favicon16 = join(__dirname, '..', 'public', 'favicon-16x16.png');

  await sharp(svgBuffer).resize(32, 32).png().toFile(favicon32);
  console.log('Generated: favicon-32x32.png');

  await sharp(svgBuffer).resize(16, 16).png().toFile(favicon16);
  console.log('Generated: favicon-16x16.png');
}

generateIcons().then(() => {
  console.log('All icons generated successfully!');
}).catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
