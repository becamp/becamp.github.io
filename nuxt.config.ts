const isProd = process.env.NODE_ENV === "production";

if (!isProd || process.env.LOCAL_ENV) {
  await import("dotenv/config");
}

const butterKey = process.env.BUTTERKEY || "";
const airtableKey = process.env.AIRTABLEKEY || "";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Runtime config
  runtimeConfig: {
    public: {
      butterKey,
      airtableKey,
    },
  },

  // App config
  app: {
    head: {
      title: "beCamp - The Charlottesville Unconference",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "beCamp is a popular Charlottesville tech conference planned by the people who show up. Come spend the day with your peers and learn something new!",
        },
        {
          property: "og:description",
          content:
            "beCamp is a popular Charlottesville tech conference planned by the people who show up. Come spend the day with your peers and learn something new!",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "152x152",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/favicon-192x192.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "512x512",
          href: "/favicon-512x512.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#e67711" },
      ],
      script: [
        { src: "/youtube.js", async: true },
        { src: "/typekit.js", async: true },
        { src: "https://www.youtube.com/iframe_api", async: true },
      ],
    },
  },

  // Plugins
  plugins: [
    "~/plugins/vuex",
    "~/plugins/components",
    "~/plugins/api",
    { src: "~/plugins/webFontLoader", mode: "client" },
    // { src: "~/plugins/lazyload", mode: "client" }, // Temporarily disabled - incompatible with Nuxt 3
    { src: "~/plugins/events", mode: "client" },
    // { src: "~/plugins/localStorage.js.disabled", mode: "client" }, // Disabled - vuex-persistedstate not installed
  ],

  // Modules
  modules: ["@nuxt/image", "@nuxtjs/sitemap", "nuxt-gtag", "@pinia/nuxt"],

  // Image module configuration
  image: {
    domains: ["v5.airtableusercontent.com"],
    staticFilename: "[publicPath]/images/[hash][ext]",
    dir: "_nuxt/images",
    presets: {
      default: {
        modifiers: {
          format: 'webp',
          quality: 80
        }
      }
    }
  },

  // Sitemap configuration
  site: { url: 'be.camp' },

  // Google Analytics configuration
  gtag: {
    id: "UA-124258426-1",
    config: {
      send_page_view: isProd,
    },
  },

  // CSS configuration
  css: ["@/assets/sass/main.scss"],

  // Loading progress bar
  loading: { color: "#FF750F" },

  // Vite configuration for SCSS
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/sass/global.scss" as *;`,
        },
      },
    },
  },

  // Build configuration
  nitro: {
    prerender: {
      routes: ["/sitemap.xml"],
    },
    storage: {
      redis: {
        driver: "redis",
        // Redis configuration if needed
      },
    },
    routeRules: {
      "/**": { headers: { "Cache-Control": "max-age=604800" } }, // 1 week cache for static assets
    },
    hooks: {
      "render:route": async (url: any, result: any, context: any) => {
        // This replaces the generate hook from Nuxt 2
        // Image downloading logic would need to be adapted for Nuxt 3
        // For now, keeping the basic structure
        // Route rendering
      },
    } as any,
  },

  // Router configuration
  router: {
    options: {
      scrollBehaviorType: "smooth",
      scrollBehavior(to: any, from: any, savedPosition: any) {
        if (savedPosition) {
          return savedPosition;
        } else {
          let position: any = {};
          if (to.matched.length < 2) {
            position = { left: 0, top: 0 };
          } else if (to.matched.some((r: any) => r.components?.default?.options?.scrollToTop)) {
            position = { left: 0, top: 0 };
          }
          if (to.hash) {
            position = { el: to.hash };
          }
          return position;
        }
      },
    },
  },

  // Compatibility date
  compatibilityDate: "2024-09-10",
});
