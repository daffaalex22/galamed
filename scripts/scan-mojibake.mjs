// Scan text files for CP-1252 double-encoded UTF-8 mojibake: UTF-8 punctuation
// bytes read through CP-1252 instead of UTF-8. Example: an em dash (UTF-8
// E2 80 94) becomes the visible garbage U+00E2 U+20AC U+201D (a-umlaut, euro
// sign, curly quote). Same for en dash and the other punctuation in TABLE.
//
// Usage:
//   node scripts/scan-mojibake.mjs        # report only
//   node scripts/scan-mojibake.mjs --fix  # repair in place (UTF-8)
//
// Why this exists: Decap CMS edits can save UTF-8 punctuation that another
// tool later re-decodes as CP-1252, producing the mojibake sequences in TABLE
// (a-umlaut + euro + curly quote) on the product pages. Re-run after CMS edits.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOTS = ["src", "api", "scripts", "public"].map((d) => join(ROOT, d));

// Each entry: [mojibake sequence in text, intended character, name].
const TABLE = [
  ["\u00e2\u20ac\u201d", "\u2014", "em dash"], // E2 80 94 -> " (0x94)
  ["\u00e2\u20ac\u201c", "\u2013", "en dash"], // E2 80 93 -> " (0x93)
  ["\u00e2\u20ac\u02dc", "\u2018", "left single quote"], // 98 -> U+02DC
  ["\u00e2\u20ac\u2122", "\u2019", "right single quote"], // 99 -> U+2122
  ["\u00e2\u20ac\u0153", "\u201c", "left double quote"], // 9C -> U+0153
  ["\u00e2\u20ac\u009d", "\u201d", "right double quote"], // 9D -> U+009D/undefined
  ["\u00e2\u20ac\ufffd", "\u201d", "right double quote (FFFD variant)"],
  ["\u00e2\u20ac\u00a6", "\u2026", "ellipsis"], // A6 -> U+00A6
  ["\u00e2\u20ac\u00a2", "\u2022", "bullet"], // A2 -> U+00A2
  ["\u00e2\u2030\u00a5", "\u2265", ">= sign"],
  ["\u00e2\u2030\u00a4", "\u2264", "<= sign"],
  ["\u00c2\u00a0", "\u00a0", "nbsp"],
  ["\u00c2\u00b7", "\u00b7", "middot"],
  ["\u00c3\u00a9", "\u00e9", "e-acute"],
  ["\u00c3\u00a8", "\u00e8", "e-grave"],
  ["\u00c3\u00ab", "\u00eb", "e-diaeresis"],
  ["\u00c3\u00b1", "\u00f1", "n-tilde"],
  ["\u00c3\u00bc", "\u00fc", "u-diaeresis"],
];

function* walk(dir) {
  const name = dir.split(/[\\/]/).pop();
  if (name === "node_modules" || name.startsWith(".")) return;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const TEXT_EXT = new Set([
  ".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json",
  ".html", ".css", ".txt", ".xml", ".yaml", ".yml",
]);

let hits = 0;
let written = 0;
const fix = process.argv.includes("--fix");
for (const dir of ROOTS) {
  try {
    readdirSync(dir);
  } catch {
    continue; // directory doesn't exist in this project
  }
  for (const p of walk(dir)) {
    if (!TEXT_EXT.has(extname(p))) continue;
    let text;
    try {
      text = readFileSync(p, "utf8");
    } catch {
      continue;
    }
    for (const [seq, intended, name] of TABLE) {
      let idx = text.indexOf(seq);
      while (idx !== -1) {
        const line = text.slice(0, idx).split("\n").length;
        const ctx = text.slice(Math.max(0, idx - 25), idx + 40).replace(/\n/g, "\\n");
        console.log(`${p}:${line} [mojibake of ${name}] ...${ctx}...`);
        hits++;
        idx = text.indexOf(seq, idx + 1);
      }
    }
    const original = text;
    if (fix) {
      for (const [seq, intended] of TABLE) {
        text = text.split(seq).join(intended);
      }
      if (text !== original) {
        if (text.includes("\ufffd")) {
          console.log(`${p}: still contains U+FFFD — repair manually, not written`);
          continue;
        }
        writeFileSync(p, text, "utf8");
        written++;
        console.log(`written: ${p}`);
      }
    }
    if (text.includes("\ufffd")) {
      console.log(`${p}: contains U+FFFD replacement char (unrecoverable byte)`);
      hits++;
    }
  }
}
if (fix) {
  console.log(written > 0 ? `FIXED ${written} file(s)` : "CLEAN: nothing to fix");
} else {
  console.log(hits === 0 ? "CLEAN: no mojibake sequences found" : `HITS: ${hits}`);
}
process.exit(hits > 0 && !fix ? 1 : 0);
