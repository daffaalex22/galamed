import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Used to build absolute URLs: canonical tags, og:url, and (later) @astrojs/sitemap.
  site: 'https://galamed.id',
  vite: {
    plugins: [tailwindcss()],
  },
});
