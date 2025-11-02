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
      <div class="tac register">
        <a
          :href="eventbriteUrl"
          target="_blank"
          rel="noopener"
        >
          <button>Register Now</button>
        </a>
      </div>
    </page-hero>

    <section class="page-section small-bottom-padding">
      <div class="wysiwyg-block">
        <div v-html="page.page_content"></div>
      </div>
    </section>

    <section class="page-section wide decorative-bg">
      <attendees-grid />
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { callOnce, definePageMeta, useHead, useRuntimeConfig } from '#imports'
import { useContentStore } from '~/stores/content'

definePageMeta({
  middleware: 'beswarm',
})

const contentStore = useContentStore()
await callOnce(async () => {
  await contentStore.hydrate()
})

const { butterPages } = storeToRefs(contentStore)
const runtimeConfig = useRuntimeConfig()
const fallbackEventbriteLink =
  runtimeConfig.public.eventbriteLink ||
  'https://airtable.com/applbJgB5JNe73ode/shrjsi9TQbUSHex8u'

type CmsRecord = Record<string, any>

const page = computed<CmsRecord | null>(() => {
  const record = butterPages.value?.attendees as CmsRecord | undefined
  return record ?? null
})

const eventbriteUrl = computed(() => {
  const link = page.value?.eventbrite_link
  if (typeof link === 'string' && link.trim() && !link.includes('EVENTBRITE_LINIK')) {
    return link
  }
  return fallbackEventbriteLink
})

useHead({
  title: 'Attendee Directory | beCamp',
  meta: [
    {
      name: 'description',
      content:
        "The who's who of beCamp. These are some of the interesting people you'll run into.",
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
.register {
  margin-top: gutter()*2;
  font-size: 1rem;
}
</style>
