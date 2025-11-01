// nuxt.config.ts
import fs from 'fs'
import md5 from 'blueimp-md5'
import download from 'image-downloader'
import { getRemoteImgContentType } from './libs/build'
import { defineNuxtConfig } from 'nuxt/config'

const isProd = process.env.NODE_ENV === 'production'

if (!isProd || process.env.LOCAL_ENV) {
  const dotenv = await import('dotenv')
  dotenv.config()
}

export default defineNuxtConfig({
  app: {
    head: {
      title: 'beCamp - The Charlottesville Unconference',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'beCamp is a popular Charlottesville tech conference planned by the people who show up. Come spend the day with your peers and learn something new!',
        },
        {
          property: 'og:description',
          content:
            'beCamp is a popular Charlottesville tech conference planned by the people who show up. Come spend the day with your peers and learn something new!',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon-512x512.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#e67711' },
      ],
      script: [
        { src: '/youtube.js', async: true },
        { src: '/typekit.js', async: true },
        { src: 'https://www.youtube.com/iframe_api', async: true },
      ],
    },
  },

  css: ['@/assets/sass/main.scss'],

  // ✅ Use Vite’s SCSS injector instead of @nuxtjs/style-resources
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/sass/global.scss" as *;`,
        },
      },
    },
  },

  // ✅ Modern Nuxt 3 modules
  modules: [
    'nuxt-simple-sitemap',   // sitemap replacement
    '@vite-pwa/nuxt',        // PWA replacement
    'nuxt-gtag',             // Google Analytics replacement
  ],

  // nuxt-simple-sitemap configuration
  sitemap: {
    siteUrl: 'https://be.camp',
    autoLastmod: true,
    sitemapName: 'sitemap.xml',
  },

  // Google Analytics (via nuxt-gtag)
  gtag: {
    id: 'UA-124258426-1',
    config: { anonymize_ip: true },
  },

  // PWA config (via @vite-pwa/nuxt)
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'beCamp',
      short_name: 'beCamp',
      description: 'The Charlottesville Unconference',
      theme_color: '#e67711',
      icons: [
        { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
  },

  runtimeConfig: {
    butterKey: process.env.BUTTERKEY || '',
    airtableKey: process.env.AIRTABLEKEY || '',
    public: {
      butterKey: process.env.BUTTERKEY || '',
      airtableKey: process.env.AIRTABLEKEY || '',
    },
  },

  router: {
    scrollBehaviorType: 'smooth',
  },

  devtools: { enabled: true },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/dynamic'],
    },

    hooks: {
      async 'prerender:generate'(route, nitro) {
        const baseDir = './.output/public/remote_img'
        const airtableDir = `${baseDir}/airtable`
        const butterDir = `${baseDir}/buttercms`
        for (const dir of [baseDir, airtableDir, butterDir]) {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        }

        const html = await nitro.storage.getItem(`prerender/${route}.html`)
        if (!html) return
        let updatedHtml = html.toString()

        // Airtable / remote images
        const matches = updatedHtml.match(/(http(s?):)([/|.|\w|\s|-|%])*\.(?:jpg|jpeg|gif|png|svg)/g)
        if (matches) {
          const localUrls = await Promise.all(
            matches.map(async (url) => {
              const ext = url.split('.').pop()
              const { filename } = await download.image({
                url,
                dest: `${airtableDir}/${md5(url)}.${ext}`,
              })
              return filename.replace('.output/public', '')
            }),
          )
          matches.forEach((m, i) => (updatedHtml = updatedHtml.replace(m, localUrls[i])))
        }

        // ButterCMS images (no extension)
        const butterMatches = updatedHtml.match(/(https:\/\/cdn\.buttercms\.com)([/|a-zA-Z0-9_])*/g)
        if (butterMatches) {
          const localButterUrls = await Promise.all(
            butterMatches.map(async (url) => {
              let fileFormat = await getRemoteImgContentType(url)
              switch (fileFormat) {
                case 'image/svg+xml':
                  fileFormat = '.svg'
                  break
                case 'image/jpeg':
                  fileFormat = '.jpg'
                  break
                case 'image/png':
                  fileFormat = '.png'
                  break
                default:
                  fileFormat = '.img'
              }
              const dest = `${butterDir}/${url.replace('https://cdn.buttercms.com/', '')}${fileFormat}`
              const { filename } = await download.image({ url, dest })
              return filename.replace('.output/public', '')
            }),
          )
          butterMatches.forEach((m, i) => (updatedHtml = updatedHtml.replace(m, localButterUrls[i])))
        }

        await nitro.storage.setItem(`prerender/${route}.html`, updatedHtml)
      },
    },
  },
})
