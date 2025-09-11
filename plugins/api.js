import Api from "../libs/api";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const api = Api({
    butterKey: config.public.butterKey,
    airtableKey: config.public.airtableKey
  });

  // Add api to the Nuxt app context
  nuxtApp.provide("api", api.addContext(nuxtApp));
});
