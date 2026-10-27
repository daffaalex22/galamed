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
  }),
});

export const collections = { products };
