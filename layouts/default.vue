<template>
  <div
    class="site-wrapper"
    :class="{
      'nav-open': mobileNavDisplay,
      'tv-mode': layout === 'tv'
    }"
  >
    <off-canvas-nav />
    <div
      class="page"
      @click.stop="closeNav"
    >
      <ClientOnly>
        <easter-egg />
      </ClientOnly>
      <site-header />
      <div class="page-content">
        <NuxtPage />
      </div>
      <ClientOnly>
        <site-footer />
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSystemStore } from '~/stores/system'
import { useContentStore } from '~/stores/content'

const systemStore = useSystemStore()
const contentStore = useContentStore()

const { mobileNavDisplay } = storeToRefs(systemStore)
const { viewMode: layout } = storeToRefs(contentStore)

const closeNav = () => {
  systemStore.setMobileNavDisplay(false)
}
</script>


<style lang="scss" scoped>
.site-wrapper {
  &.nav-open {
    & > .page {
      transform: translate3d(-250px, 0, 0);
      transition: transform .5s;
    }
  }

  & > .page {
    transition: transform .5s;
  }

  .page-content {
    background-color: #fff;
  }
}
</style>
