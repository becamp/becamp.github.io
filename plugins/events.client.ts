import { useSystemStore } from '~/stores/system'
import { useContentStore } from '~/stores/content'

declare global {
  interface Window {
    ytReady?: boolean
  }
}

export default defineNuxtPlugin(() => {
  if (import.meta.server) {
    return
  }

  const systemStore = useSystemStore()
  const contentStore = useContentStore()

  const updateViewport = () => {
    systemStore.setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    })
  }

  window.addEventListener('resize', updateViewport)
  updateViewport()

  // It's going to be faster to operate on our local variable.
  let scrollTop = 0
  const observe = () => {
    const unroundedPos = window.pageYOffset || document.documentElement.scrollTop
    const pos = Math.round(100 * unroundedPos) / 100
    if (scrollTop !== pos) {
      scrollTop = pos
      systemStore.setScrollPosition({
        top: scrollTop,
      })
    }
    window.requestAnimationFrame(observe)
  }
  window.requestAnimationFrame(observe)

  window.addEventListener('youtubeLoaded', () => contentStore.setYoutubeReady(true))
  if (window.ytReady) {
    contentStore.setYoutubeReady(true)
  }
})
