// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://be.camp',
  image: {
    // Airtable attachment URLs expire; Astro downloads them into the build instead.
    remotePatterns: [{ protocol: 'https', hostname: '**.airtableusercontent.com' }]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
