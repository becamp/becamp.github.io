# Nuxt 2 → Nuxt 3 Migration Guide

This guide walks through converting a Nuxt 2 static site to Nuxt 3 while adopting Pinia for state management and ensuring every route prerenders at build time. Treat the steps as a checklist—complete each before moving to the next to keep the migration controlled and testable.

## 1. Pre-Migration Inventory
- Branch from `main` and freeze deploys until the migration is validated.
- Record current Node, npm, and Nuxt versions plus custom build scripts.
- List all Nuxt modules, server middleware, plugins, and Vuex stores (location, responsibility, API dependencies).
- Capture every page using `asyncData`, `fetch`, or client-only API calls; note routes generated dynamically.
- Export current environment variables and how they flow to the client.
- Run `npm run generate` to ensure the Nuxt 2 baseline passes before you change anything.

## 2. Upgrade Tooling & Dependencies
1. Align on Node 20.17.0 (Volta or `.nvmrc`); upgrade npm if needed.
2. Replace Nuxt 2 dependencies with Nuxt 3 equivalents:
   ```bash
   npm uninstall nuxt @nuxtjs/axios @nuxtjs/pwa vuex
   npm install --save-dev nuxt@latest typescript vue-tsc
   npm install pinia @pinia/nuxt
   ```
3. Update npm scripts to use `nuxi` (Nuxt CLI):
   ```json
   {
     "scripts": {
       "dev": "nuxt dev",
       "build": "nuxt build",
       "generate": "nuxt generate",
       "preview": "nuxt preview",
       "lint": "eslint .",
       "lint:fix": "eslint . --fix",
       "typecheck": "vue-tsc --noEmit"
     }
   }
   ```
4. Add a `tsconfig.json` (or extend existing) to include `types: ['@pinia/nuxt']` and Nuxt’s auto-imported modules.

## 3. Configuration Migration
1. Rename `nuxt.config.js` to `nuxt.config.ts`.
2. Replace legacy keys with Nuxt 3 equivalents:
   ```ts
   export default defineNuxtConfig({
     ssr: true,
     modules: ['@pinia/nuxt', '@nuxt/image'],
     runtimeConfig: {
       AIRTABLEKEY: process.env.AIRTABLEKEY,
       public: {
         BUTTERKEY: process.env.BUTTERKEY
       }
     },
     app: {
       head: {
         title: 'beCamp',
         meta: [{ name: 'description', content: 'Charlottesville unconference' }]
       }
     },
     nitro: {
       preset: 'static',
       prerender: { crawlLinks: true, routes: ['/sitemap.xml'] }
     }
   })
   ```
3. Move custom webpack configuration into `vite: { }` or remove if no longer needed.
4. Convert build-time environment handling into `runtimeConfig` (private keys) and `runtimeConfig.public` (client-safe values).

## 4. Routing, Layouts, and Components
- Convert Options API components to `<script setup>` or Composition API:
  ```vue
  <script setup lang="ts">
  const route = useRoute()
  const { data } = await useAsyncData('page', () =>
    fetchPageContent(route.params.slug as string)
  )
  </script>
  ```
- Replace `head()`/`metaInfo()` with `useHead`.
- Update layout registration—Nuxt 3 auto-imports layouts from `layouts/`.
- Convert middleware to file-based middleware using `defineNuxtRouteMiddleware`.
- Drop `this.$route`, `this.$router` in favor of `useRoute`, `useRouter`.

## 5. Vuex → Pinia Refactor
1. Create a `stores/` directory and enable auto imports via `@pinia/nuxt`.
2. Migrate each Vuex module to a Pinia store:
   ```ts
   // stores/lightbox.ts
   export const useLightboxStore = defineStore('lightbox', () => {
     const isOpen = ref(false)
     const currentImage = ref<string | null>(null)

     function open(image: string) {
       currentImage.value = image
       isOpen.value = true
     }

     function close() {
       isOpen.value = false
       currentImage.value = null
     }

     return { isOpen, currentImage, open, close }
   })
   ```
3. Replace `mapState`, `mapGetters`, `mapActions` with Pinia composables:
   ```vue
   <script setup lang="ts">
   const lightbox = useLightboxStore()
   const { isOpen, currentImage } = storeToRefs(lightbox)
   </script>
   ```
4. For SSR, keep state serializable (plain objects/refs) and load data in server context:
   ```ts
   const sponsorsStore = useSponsorsStore()
   await callOnce(() => sponsorsStore.fetchAll())
   ```
   `@pinia/nuxt` automatically serializes the state into the HTML payload.
5. Remove Vuex plugins and helpers; port logic into Pinia actions or Nuxt plugins as needed.

## 6. Data Fetching & Async Strategy
- Replace `asyncData`/`fetch` with `useAsyncData`, `useFetch`, or composables. Example:
  ```ts
  const { data: sponsors } = await useAsyncData('sponsors', () =>
    $fetch('/api/sponsors')
  )
  ```
- Use server utilities for external APIs to guarantee build-time availability:
  ```ts
  // server/utils/butter.ts
  export async function getButterPage(slug: string) {
    const config = useRuntimeConfig()
    return await $fetch(`https://api.buttercms.com/v2/pages/${slug}`, {
      params: { auth_token: config.BUTTERKEY }
    })
  }
  ```
- Call server utilities inside `useAsyncData` with `{ server: true }` to avoid client-side fetches.
- Cache remote results with Nitro storage or local JSON files during build if providers have rate limits.

## 7. Plugin & Middleware Updates
- Convert plugins to ESM modules:
  ```ts
  export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    return { provide: { butterKey: config.public.BUTTERKEY } }
  })
  ```
- Split client/server-specific code into `.client.ts` and `.server.ts` files.
- Register global components via auto-imports (`components:` directory) instead of manual plugin registration.
- Update middleware to `defineNuxtRouteMiddleware((to, from) => { ... })`.

## 8. Static Prerendering & Payload Strategy
1. Set Nitro preset to `static` and enable route crawling (`crawlLinks: true`).
2. For dynamic routes (e.g., `/history/[year]`), generate the list at build time:
   ```ts
   export default defineNuxtConfig({
     nitro: {
       prerender: {
         crawlLinks: true,
         routes: ['/sitemap.xml'],
         failOnError: true
       },
       hooks: {
         'prerender:routes'(routes) {
           const years = getAllHistoryYearsSync()
           years.forEach((year) => routes.add(`/history/${year}`))
         }
       }
     }
   })
   ```
3. Ensure all data is resolved server-side; remove any `mounted()` fetches that hydrate critical content.
4. Validate generated HTML in `.output/public`—content should be fully rendered without pending loaders.
5. Configure fallback route (if needed) via `routeRules` instead of `generate.fallback`.

## 9. Verification Checklist
- `npm run lint` and `npm run typecheck` succeed.
- `npm run generate` completes without warnings; review `nitro/prerender` logs for skipped routes.
- `npm run preview` serves static output; navigate key routes offline to confirm zero runtime fetches.
- Run Lighthouse/Chrome audits to confirm performance, accessibility, SEO ≥ 90.
- Smoke test CMS data by editing content, triggering rebuild, and confirming output matches expectations.
- Audit environment variable usage—no secrets exposed in client bundle.

## 10. Post-Migration Follow-Up
- Update README, ADRs, and onboarding docs to reflect Nuxt 3, Pinia, and static workflow.
- Train maintainers on new store patterns and async helpers.
- Monitor deploy pipeline for longer build times; add caching or split builds if necessary.
- Schedule a retrospective to capture lessons learned and backlog any remaining Vue 2 idioms for cleanup.

By following these steps you will land on a Nuxt 3 codebase that uses Pinia for state management, generates deterministic static output, and retains the existing CMS-driven workflows without client-side API calls.
