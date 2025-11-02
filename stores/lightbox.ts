import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLightboxStore = defineStore('lightbox', () => {
  const visible = ref(false)
  const content = ref('')

  function setVisibility(value: boolean) {
    visible.value = value
  }

  function setContent(value: string) {
    content.value = value
  }

  function open(value: string) {
    setContent(value)
    setVisibility(true)
  }

  function close() {
    setVisibility(false)
    setContent('')
  }

  return {
    visible,
    content,
    setVisibility,
    setContent,
    open,
    close,
  }
})
