import { createStore } from 'vuex'
import * as index from '~/store/index.js'
import * as system from '~/store/system.js'
import * as lightbox from '~/store/lightbox.js'
import Api from '~/libs/api.js'

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig();
  const api = Api({
    butterKey: config.public.butterKey,
    airtableKey: config.public.airtableKey
  });

  const store = createStore({
    state: index.state,
    getters: index.getters,
    mutations: index.mutations,
    actions: index.actions,
    modules: {
      system: {
        namespaced: true,
        state: system.state,
        getters: system.getters,
        mutations: system.mutations,
        actions: system.actions
      },
      lightbox: {
        namespaced: true,
        state: lightbox.state,
        getters: lightbox.getters,
        mutations: lightbox.mutations,
        actions: lightbox.actions
      }
    }
  })

  store.$api = api.addContext(nuxtApp);

  nuxtApp.vueApp.use(store)
  nuxtApp.provide('store', store)
})