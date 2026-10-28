import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Products are edited by the back-office team via Decap CMS (/admin).
// One Markdown file per product in src/content/products/.
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    short: z.string().default(''),
    desc: z.string(),
    category: z.enum(['Kasa & Kapas', 'Perawatan Luka', 'Antiseptik']),
    image: z.string().default('/legacy/sterile.webp'),
    // Standar ukuran produk (mis. "5x5 cm"). Opsional — hanya diisi bila ada
    // ukuran standar yang konkrit; dipakai di Product schema (additionalProperty).
    ukuran: z.string().optional(),
    // Tanggal konten terakhir diperbarui. Tampil sebagai "Terakhir diperbarui"
    // dan dipakai sebagai dateModified di Product schema (sinyal freshness).
    updated: z.date().optional(),
  }),
});

export const collections = { products };
