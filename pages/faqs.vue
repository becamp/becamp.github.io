<template>
  <div
    v-if="page"
    class="page-wrapper"
  >
    <page-hero
      :background="page.hero_image"
      :accent-color="page.page_accent_color"
    >
      <h1 class="page-title">
        {{ page.page_title }}
      </h1>
      <div class="page-description">
        {{ page.page_description }}
      </div>
    </page-hero>

    <section class="page-section">
      <div class="wysiwyg-block">
        <div v-html="page.page_content"></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { callOnce, definePageMeta, useHead } from '#imports'
import { useContentStore } from '~/stores/content'

definePageMeta({
  middleware: 'beswarm',
})

const contentStore = useContentStore()
await callOnce(async () => {
  await contentStore.hydrate()
})

const { butterPages } = storeToRefs(contentStore)

type CmsRecord = Record<string, any>

const page = computed<CmsRecord | null>(() => {
  const record = butterPages.value?.faqs as CmsRecord | undefined
  return record ?? null
})

useHead({
  title: 'FAQs | beCamp',
  meta: [
    {
      name: 'description',
      content: 'Everything you wanted to know about beCamp, but were maybe too afraid to ask.',
      key: 'description',
    },
  ],
})

watchEffect(() => {
  const accent = typeof page.value?.page_accent_color === 'string' ? page.value.page_accent_color : null
  if (accent) {
    contentStore.setCurrentPageAccentColor(accent)
  }
})
</script>

<style lang="scss" scoped>

</style>
