// Generates the root favicon set from public/legacy/logo-mark.png (1000x1000):
//
// - public/favicon.ico           16/32/48 in one file — the classic fallback
//                                that browsers and crawlers fetch at
//                                /favicon.ico even without a <link rel="icon">.
// - public/favicon-96x96.png     Squared 96px master icon: Google's favicon
//                                guidelines expect a 1:1 icon and recommend
//                                going larger than 48x48px.
// - public/apple-touch-icon.png  180x180 flattened onto white — Apple icons
//                                render transparency as black, so don't ship
//                                the raw transparent mark to iOS.
//
// Favicons need a stable URL forever ("the favicon URL must be stable", per
// Google's favicon guidelines), so this runs once / when the brand mark
// changes — it is NOT wired into the build, unlike optimize-images.
//
// Run manually with: npm run favicons

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SOURCE = path.join('public', 'legacy', 'logo-mark.png');
const OUT_DIR = 'public';
const ICO_SIZES = [16, 32, 48];
const APPLE_ICON_SIZE = 180;
const APPLE_BG = '#ffffff';

/**
 * @param {number} size
 * @param {{ flatten?: boolean }} [options]
 * @returns {Promise<Buffer>}
 */
async function pngBuffer(size, { flatten = false } = {}) {
  let pipeline = sharp(await readFile(SOURCE), { failOn: 'none' }).resize(size, size, {
    kernel: 'lanczos3',
  });
  if (flatten) {
    pipeline = pipeline.flatten({ background: APPLE_BG });
  }
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

// Assemble the multi-size .ico by hand: sharp has no ICO encoder.
// Layout per the ICONDIR spec: a 6-byte header, a 16-byte directory entry per
// image, then the concatenated PNG payloads (PNG-in-ICO is supported by every
// browser and Windows Vista onward).
const pngs = [];
for (const size of ICO_SIZES) {
  pngs.push(await pngBuffer(size));
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(ICO_SIZES.length, 4); // image count

const directory = Buffer.alloc(16 * ICO_SIZES.length);
let offset = header.length + directory.length;
ICO_SIZES.forEach((size, i) => {
  const at = i * 16;
  directory.writeUInt8(size % 256, at); // width (0 would mean 256)
  directory.writeUInt8(size % 256, at + 1); // height
  directory.writeUInt8(0, at + 2); // palette entry count (unused for PNG)
  directory.writeUInt8(0, at + 3); // reserved
  directory.writeUInt16LE(1, at + 4); // color planes
  directory.writeUInt16LE(32, at + 6); // bpp stated per entry
  directory.writeUInt32LE(pngs[i].length, at + 8);
  directory.writeUInt32LE(offset, at + 12); // payload offset from file start
  offset += pngs[i].length;
});

await writeFile(
  path.join(OUT_DIR, 'favicon.ico'),
  Buffer.concat([header, directory, ...pngs]),
);
await writeFile(path.join(OUT_DIR, 'favicon-96x96.png'), await pngBuffer(96));
await writeFile(
  path.join(OUT_DIR, 'apple-touch-icon.png'),
  await pngBuffer(APPLE_ICON_SIZE, { flatten: true }),
);

console.log(`favicon.ico        16/32/48 from ${SOURCE}`);
console.log(`favicon-96x96.png  96px`);
console.log(`apple-touch-icon.png  ${APPLE_ICON_SIZE}px, flattened`);
