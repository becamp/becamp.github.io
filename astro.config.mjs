// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://be.camp',
  integrations: [sitemap()],
  redirects: {
    // The old Nuxt site had a /history page; its story lives on /about now.
    '/history': '/about'
  },
  image: {
    // Airtable attachment URLs expire; Astro downloads them into the build instead.
    remotePatterns: [{ protocol: 'https', hostname: '**.airtableusercontent.com' }]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
