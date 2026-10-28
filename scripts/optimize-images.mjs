// Optimizes CMS-managed images in public/ in place, right before `astro build`.
//
// Why not astro:assets? Decap CMS (/admin) uploads photos straight to
// public/images/products and renders previews from those public URLs — moving
// them to src/assets would break the editor's image picker. This script gives
// the same performance outcome (small files) while keeping the CMS untouched.
//
// Behavior:
// - Files under SIZE_FLOOR are skipped, so already-optimized images are never
//   recompressed again on later builds (quality would degrade).
// - Photos are resized to fit MAX_DIMENSION (square product shots display at
//   ~350px, so 900px leaves plenty of retina headroom) and re-encoded with
//   mozjpeg. Format is preserved, so frontmatter paths stay valid.
//
// Run manually with: npm run images

import { readdir, stat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SIZE_FLOOR = 150 * 1024; // skip files already smaller than 150 KB
const MAX_DIMENSION = 900;
const QUALITY = 78;

const targets = ['public/images/products', 'public/images/deriv'];

let beforeTotal = 0;
let afterTotal = 0;

for (const dir of targets) {
  const entries = await readdir(dir).catch(() => []);
  for (const file of entries) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
    const full = path.join(dir, file);
    const { size } = await stat(full);
    if (size < SIZE_FLOOR) {
      console.log(`skip  ${file} (${kb(size)} KB, already small)`);
      continue;
    }

    const before = size;
    // Read into memory first: on Windows, writing back to the same path while
    // sharp holds the file open fails with UNKNOWN (-4094).
    const input = sharp(await readFile(full));
    const meta = await input.metadata();
    const { width = 0, height = 0 } = meta;
    const needsResize = Math.max(width, height) > MAX_DIMENSION;

    let pipeline = sharp(await input.toBuffer(), { failOn: 'none' });
    if (needsResize) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    if (/\.png$/i.test(file)) {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    } else if (/\.webp$/i.test(file)) {
      pipeline = pipeline.webp({ quality: QUALITY });
    } else {
      pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true, progressive: true });
    }

    const output = await pipeline.toBuffer();
    // Only keep the result if it is actually smaller; otherwise leave the
    // original untouched (protects already well-compressed images).
    if (output.length < before) {
      await writeFile(full, output);
      console.log(
        `opt   ${file}  ${kb(before)} KB -> ${kb(output.length)} KB` +
          (needsResize ? `  (resized ${width}x${height})` : '')
      );
      beforeTotal += before;
      afterTotal += output.length;
    } else {
      console.log(`skip  ${file} (${kb(before)} KB, optimization would not help)`);
    }
  }
}

console.log(
  `\nTotal: ${kb(beforeTotal)} KB -> ${kb(afterTotal)} KB` +
    (beforeTotal ? ` (saved ${kb(beforeTotal - afterTotal)} KB)` : '')
);

function kb(bytes) {
  return Math.round(bytes / 1024);
}
