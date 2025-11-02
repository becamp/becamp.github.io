<template>
  <section
    class="page-hero"
    :style="{backgroundImage: heroBackgroundImage}"
    :data-accent-color="currentPageAccentColor"
  >
    <div class="content">
      <slot />
    </div>

    <ClientOnly>
      <div
        class="background-video"
        v-show="showVideo"
        v-if="videoBackground"
        aria-hidden="true"
      >
        <div
          class="video-bg cover"
          :class="{show: unmaskVideo}"
        >
          <div class="video-fg">
            <div id="yt-player"></div>
          </div>
        </div>
      </div>
    </ClientOnly>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useContentStore } from '~/stores/content'
import { useSystemStore } from '~/stores/system'

type YouTubePlayer = {
  mute?: () => void
  playVideo?: () => void
  destroy?: () => void
  seekTo?: (seconds: number, allowSeekAhead?: boolean) => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, options: Record<string, unknown>) => YouTubePlayer
    }
    ytReady?: boolean
  }
}

const props = withDefaults(
  defineProps<{
    background?: string
    videoBackground?: string
  }>(),
  {
    background: '/hero-1.jpg',
    videoBackground: undefined,
  },
)

const showVideo = ref(true)
const unmaskVideo = ref(false)
const player = ref<YouTubePlayer | null>(null)

const contentStore = useContentStore()
const { youtubeAPIReady, currentPageAccentColor } = storeToRefs(contentStore)

const systemStore = useSystemStore()
const { viewportWidth } = storeToRefs(systemStore)

const heroBackgroundImage = computed(() =>
  props.background ? `url("${props.background}")` : 'url("/hero-1.jpg")',
)

const shouldBootVideo = computed(
  () => Boolean(props.videoBackground) && viewportWidth.value >= 860,
)

const onPlayerReady = () => {
  if (player.value) {
    player.value.mute?.()
    player.value.playVideo?.()
    unmaskVideo.value = true
  }
}

const onPlayerStateChange = (event: { data: number }) => {
  if (event?.data === 0 && player.value) {
    player.value.seekTo?.(0)
  }
}

const bootBackgroundVideo = () => {
  if (import.meta.server || typeof window === 'undefined' || !youtubeAPIReady.value || !shouldBootVideo.value || player.value) {
    return
  }

  const mountPlayer = () => {
    const target = document.getElementById('yt-player')
    if (!target) {
      window.setTimeout(mountPlayer, 500)
      return
    }

    if (window.YT?.Player && props.videoBackground) {
      player.value = new window.YT.Player('yt-player', {
        videoId: props.videoBackground,
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      })
    }
  }

  if (window.YT) {
    mountPlayer()
  }
}

watchEffect(() => {
  showVideo.value = viewportWidth.value >= 860
})

watchEffect(() => {
  bootBackgroundVideo()
})

onBeforeUnmount(() => {
  if (player.value) {
    player.value.destroy?.()
    player.value = null
  }
})
</script>

<style lang="scss" scoped>
.page-hero {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center top;
  padding: 6em gutter() 20vw gutter();
  position: relative;
  border-bottom: 1em solid $accent;
  position: relative;
  overflow: hidden;

  @include bp($m) {
    padding-top: 7em;
    padding-bottom: 6em;
  }
  @include bp($ml) {
    padding-top: 10em;
    padding-bottom: 12em;
  }

  @supports (-webkit-clip-path: polygon(0 0, 0 0)) or (clip-path: polygon(0 0, 0 0)) {
    border-bottom: none;

    &:before,
    &:after {
      content: '';
      display: block;
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 12vw;
      z-index: 2;
    }
    &:before {
      background-color: $accent;
      clip-path: polygon(
        0% 28%, 25% 75%, 100% 0%,
        100% 99.9%, 0% 99.9%
      )
    }
    &:after {
      background-color: #fff;
      clip-path: polygon(
        0% 50%, 25% 100%, 100% 10%,
        100.5% 100.5%, 0% 100.5%
      );
    }

    @include bp($m) {
      &:before {
        clip-path: polygon(
          0% 20%, 25% 85%, 100% 0%,
          100% 99.9%, 0% 99.9%
        )
      }
      &:after {
        clip-path: polygon(
          0% 40%, 25% 100%, 100% 3%,
          100.5% 100.5%, 0% 100.5%
        );
      }
    }

    @include bp($l) {
      &:before {
        clip-path: polygon(
          0% 28%, 25% 92%, 100% 0%,
          100% 99.9%, 0% 99.9%
        )
      }
      &:after {
        clip-path: polygon(
          0% 40%, 25% 100%, 100% 3%,
          100.5% 100.5%, 0% 100.5%
        );
      }
    }

    &[data-accent-color="blue"] {
      &:before { background-color: $accent4 !important; }
    }
    &[data-accent-color="black"] {
      &:before { background-color: $dark !important; }
    }
  }

  @include bp($ml) {
    margin-top: 0;
  }

  .content {
    position: relative;
    z-index: 1;
  }

  .background-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
  }

  .video-bg {
    background: #fff;
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    opacity: 0;
    transition: opacity 2s .5s;

    &.show {
      opacity: 1;

      .video-fg {
        opacity: .15;
        transition: opacity 1s;
      }
    }
  }
  .video-bg,
  .video-fg {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    :deep(iframe) {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }

  /*
  Full page video background
  Simulate object-fit: cover
  Based on http://fvsch.com/code/video-background/
  */
  @media (min-aspect-ratio: 16/9) {
    .video-bg.cover .video-fg { height: 300%; top: -100%; }
  }
  @media (max-aspect-ratio: 16/9) {
    .video-bg.cover .video-fg { width: 300%; left: -100%; }
  }

  @supports (object-fit: cover) {
    .video-bg.cover .video-fg.supports-cover {
      width: 100%;
      height: 100%;
      top: 0; left: 0;
    }
    .video-bg.cover video {
      object-fit: cover;
    }
  }

  /*
    Vertical centering for 16/9 youtube iframes and video elements
    Simulate object-fit: contain for entire element, not just contents of element
  */
  .video-bg.contain {
    font-size: 0;
  }
  .video-bg.contain * {
    font-size: 16px;
  }
  .video-bg.contain:before {
    content: '';
    display: inline-block;
    height: 100%;
    vertical-align: middle;
  }
  .video-bg.contain .video-fg {
    display: inline-block;
    vertical-align: middle;
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 */
    pointer-events: none;
  }
  .video-bg.contain iframe,
  .video-bg.contain video {
    pointer-events: none;
  }

  @media (min-aspect-ratio: 16/9) {
    .video-bg.contain .video-fg {
      height: 100%;
      padding-bottom: 0;
      max-width: ((30vh) * 16 / 9);
      left: 50%;
      margin-left: ((30vh) * 16 / 9) / -2;
    }
  }
}
:deep(.page-title) {
  text-align: center;
  font-weight: bold;
}
:deep(.page-description) {
  text-align: center;
}
</style>
