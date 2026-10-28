// One-off validation of generated JSON-LD (run: node scripts/check-schema.mjs)
import { readFileSync } from 'node:fs';

function check(file) {
  const html = readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  console.log(`${file}: ${scripts.length} JSON-LD block(s)`);
  for (const [, json] of scripts) {
    try {
      const data = JSON.parse(json);
      const nodes = data['@graph'] ?? [data];
      const summary = nodes
        .map((n) => `${n['@type']}${n['@id'] ? ' (' + n['@id'].replace('https://galamed.id', '') + ')' : ''}`)
        .join(', ');
      console.log(`  OK: ${summary}`);
      const lb = nodes.find((n) => n['@type'] === 'LocalBusiness');
      if (lb) {
        console.log(`    logo=${lb.logo}`);
        console.log(`    hours=${lb.openingHoursSpecification.map((h) => `${h.opens}-${h.closes} ${h.dayOfWeek.join(',')}`).join('; ')}`);
        console.log(`    address=${lb.address?.streetAddress ?? '(none)'}`);
      }
      const il = nodes.find((n) => n['@type'] === 'ItemList');
      if (il) {
        console.log(`    ItemList entries: ${il.itemListElement.length}, first=${il.itemListElement[0].item.url}`);
      }
      const prod = nodes.find((n) => n['@type'] === 'Product');
      if (prod) console.log(`    Product: ${prod.name} | image=${prod.image}`);
      const bc = nodes.find((n) => n['@type'] === 'BreadcrumbList');
      if (bc) console.log(`    Breadcrumb: ${bc.itemListElement.map((x) => x.name).join(' > ')}`);
      const fp = nodes.find((n) => n['@type'] === 'FAQPage');
      if (fp) console.log(`    FAQPage: ${fp.mainEntity.length} questions, first="${fp.mainEntity[0].name}"`);
    } catch (e) {
      console.log(`  INVALID JSON: ${e.message}`);
    }
  }
}

check('dist/index.html');
check('dist/produk/kasa-hidrofil-lipat/index.html');
check('dist/produk/kasa-hidrofil-big-gauze/index.html');
