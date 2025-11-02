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
        <div
          class="cms-content"
          v-html="page.page_content"
        ></div>
        <becamp-schedule />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { callOnce, definePageMeta, useHead, useRoute } from '#imports'
import { useContentStore } from '~/stores/content'

definePageMeta({
  middleware: 'beswarm',
})

const route = useRoute()
const contentStore = useContentStore()

await callOnce(async () => {
  await contentStore.hydrate()
})

const { butterPages } = storeToRefs(contentStore)

type CmsRecord = Record<string, any>

const page = computed<CmsRecord | null>(() => {
  const record = butterPages.value?.schedule as CmsRecord | undefined
  return record ?? null
})

useHead({
  title: 'Schedule | beCamp',
  meta: [
    {
      name: 'description',
      content:
        "Here's the full schedule of everything that's happening and when at beCamp. Don't miss a thing!",
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

watchEffect(() => {
  const mode = route.query.mode
  if (typeof mode === 'string') {
    contentStore.setViewMode(mode)
  } else if (mode === undefined) {
    contentStore.setViewMode('')
  }
})

onBeforeUnmount(() => {
  contentStore.setViewMode('')
})
</script>

<style lang="scss">
.tv-mode {
  .off-canvas-nav,
  .site-header,
  .global-site-footer,
  .page-hero,
  .cms-content {
    display: none;
  }

  .page-section {
    max-width: 100%;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    padding: gutter();

    .wysiwyg-block {
      width: 100%;
      max-width: 100%;
    }
  }

  .time-block[data-time="12:05pm - 12:35pm"],
  .time-block[data-time="12:35pm - 1:25pm"],
  .time-block[data-time="1:25pm - 1:55pm"],
  .time-block[data-time="3:40pm - 4:05pm"],
  .time-block[data-time="4:05pm - Whenever"]{
    width: 33.33%;
    float: left;

    .event {
      width: 90% !important;
    }
  }

  .event {
    width: 19% !important;
    border: 1px solid rgba($dark, .5) !important;
    padding: .5em !important;

    &:first-child:last-child {
      width: 50% !important;
    }
  }
  .event-time {
    font-size: 1.33rem;
    margin: 0 0 .5em 0 !important;
  }
  .event-data {
    .topic {
      font-size: 1.15rem;
    }
  }
  .event-location {
    border: 1px solid rgba($dark, .5);
    font-size: 1rem !important;
    padding: 0.25em !important;
  }
}
</style>
