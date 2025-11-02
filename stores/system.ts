import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

type Viewport = {
  width: number
  height: number
}

type ScrollPosition = {
  top: number
}

type NavItem = {
  name: string
  route: string
}

export const useSystemStore = defineStore('system', () => {
  const mobileNavDisplay = ref(false)
  const viewport = reactive<Viewport>({
    width: 960,
    height: 0,
  })
  const dismissedPrompts = ref<string[]>([])
  const scroll = reactive<ScrollPosition>({
    top: 0,
  })
  const navItems = ref<NavItem[]>([
    { name: 'Attendees', route: '/attendees' },
    { name: 'Schedule', route: '/schedule' },
    { name: 'Sponsors', route: '/sponsors' },
    { name: 'FAQs', route: '/faqs' },
    { name: 'History', route: '/history' },
  ])

  const viewportWidth = computed(() => viewport.width)

  const dismissedPromptSet = computed(() => new Set(dismissedPrompts.value))

  function setMobileNavDisplay(value: boolean) {
    mobileNavDisplay.value = value
  }

  function toggleMobileNavDisplay() {
    mobileNavDisplay.value = !mobileNavDisplay.value
  }

  function setViewport(value: Viewport) {
    viewport.width = value.width
    viewport.height = value.height
  }

  function setScrollPosition(value: ScrollPosition) {
    scroll.top = value.top
  }

  function dismissPrompt(promptId: string) {
    if (!dismissedPromptSet.value.has(promptId)) {
      dismissedPrompts.value.push(promptId)
    }
  }

  return {
    mobileNavDisplay,
    viewport,
    dismissedPrompts,
    scroll,
    navItems,

    viewportWidth,
    dismissedPromptSet,

    setMobileNavDisplay,
    toggleMobileNavDisplay,
    setViewport,
    setScrollPosition,
    dismissPrompt,
  }
})
