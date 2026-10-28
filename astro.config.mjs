import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Used to build absolute URLs: canonical tags, og:url, and the sitemap.
  site: 'https://galamed.id',
  // Auto-generates sitemap-index.xml (+ sitemap-0.xml) from all pages at build.
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
