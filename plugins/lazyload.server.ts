import { defineNuxtPlugin } from '#imports'
import type { DirectiveBinding } from 'vue'

const resolveSrc = (binding: DirectiveBinding<unknown>): string | undefined => {
  const value = binding.value
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && 'src' in value && typeof value.src === 'string') {
    return value.src
  }

  return undefined
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('lazy', {
    getSSRProps(binding) {
      const src = resolveSrc(binding)
      return src ? { src } : {}
    }
  })

  nuxtApp.vueApp.directive('lazy-container', {
    getSSRProps() {
      return {}
    }
  })
})
