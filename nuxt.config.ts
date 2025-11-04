// nuxt.config.ts
import fs from 'fs'
import md5 from 'blueimp-md5'
import download from 'image-downloader'
import { getRemoteImgContentType } from './libs/build'
import { defineNuxtConfig } from 'nuxt/config'

const isProd = process.env.NODE_ENV === 'production'
const enablePwa = process.env.NUXT_ENABLE_PWA === 'true'

if (!isProd || process.env.LOCAL_ENV) {
  const dotenv = await import('dotenv')
  dotenv.config()
}

export default defineNuxtConfig({
  image: {
    domains: ['v5.airtableusercontent.com', 'cdn.buttercms.com']
  },
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
    '@pinia/nuxt',          // state management
    'nuxt-simple-sitemap',   // sitemap replacement
    '@vite-pwa/nuxt',        // PWA replacement
    'nuxt-gtag',             // Google Analytics replacement
    '@nuxt/image',
  ],

  site: {
    url: 'https://be.camp',
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
    disable: !enablePwa,
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
      siteUrl: 'https://be.camp',
      eventbriteLink:
        process.env.EVENTBRITE_LINK ||
        'https://airtable.com/applbJgB5JNe73ode/shrjsi9TQbUSHex8u',
    },
  },

  devtools: { enabled: true },

  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/attendees', '/faqs', '/history', '/schedule', '/sponsors', '/sitemap.xml'],
    },
  },
})
