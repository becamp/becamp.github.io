
<template>
  <div
    v-if="page"
    class="page-wrapper"
  >
    <html-lightbox />

    <page-hero
      :background="heroBackground"
      :accent-color="heroAccent"
      :video-background="heroVideoBackground"
    >
      <div class="inner">
        <div class="event-headline">
          <div v-html="setAttendeeCount(heroContent)"></div>
          <!-- Wondering where this is? Go to "Guests" in the forked Airtable Base and change the "Grid view" to the form's view. -->
          <a
            :href="eventbriteUrl"
            target="_blank"
            rel="noopener"
          >
            <button>Register Now</button>
          </a>
        </div>

        <div class="event-countdown">
          <div class="countdown-timer">
            <div
              class="countdown-label"
              v-html="eventDateLabel"
            />
            <countdown-clock />
          </div>
          <div
            class="intro-video"
            v-if="heroVideoId"
          >
            <a
              :href="`https://www.youtube.com/watch?v=${heroVideoId}`"
              target="_blank"
              rel="noopener"
              @click.prevent="showLightbox(youtubeVideo)"
              name="no-decoration"
            >
              <img src="/play.svg" aria-hidden="true" alt="play button">
              <p id="beCamp-video">What is beCamp?</p>
            </a>
          </div>
        </div>
      </div>
    </page-hero>

    <section class="page-section what-is-becamp">
      <h1 class="section-title">What is beCamp?</h1>
      <media-block
        v-for="(block, index) in whatIsBeCamp"
        :key="block.copy || index"
        :content="block"
        :alt-layout="index % 2 === 1"
      />
      <div
        class="cta"
        v-if="heroVideoId"
      >
        <h2>Need a quick overview? </h2>
        <a
          :href="`https://www.youtube.com/watch?v=${heroVideoId}`"
          target="_blank"
          rel="noopener"
          name="beCamp promo video link"
        >
          <button @click="showLightbox(youtubeVideo)">
            What is beCamp? (Video)
          </button>
        </a>
      </div>
    </section>

    <section class="page-section tac why-attend-becamp decorative-bg">
      <div class="wysiwyg-block">
        <h1 class="section-title small-margin">Why should I attend beCamp?</h1>
        <div v-html="whyAttendCopy"></div>
        <icon-grid :icons="sponsorshipPerks" />
      </div>

      <div class="cta">
        <h2>Let us know you're attending!</h2>
        <p>It's quick and easy, and guarantees we get your shirt size correct.</p>
        <a
          :href="eventbriteUrl"
          target="_blank"
          rel="noopener"
        >
          <button>Register Now</button>
        </a>
        <div class="wysiwyg-block">
          <div v-html="safeInclusiveCopy"></div>
        </div>
      </div>
    </section>

    <section class="page-section wide tac becamp-sponsors">
      <div class="wysiwyg-block">
        <h1 class="section-title small-margin">beCamp wouldn't be possible without our <span class="accent">awesome</span>&nbsp;sponsors!</h1>
        <div v-html="sponsorsIntroCopy"></div>
      </div>
      <becampSponsors />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { callOnce, useRuntimeConfig } from '#imports'
import becampSponsors from '~/components/becampSponsors.vue'
import { useContentStore } from '~/stores/content'
import { useLightboxStore } from '~/stores/lightbox'

const contentStore = useContentStore()
await callOnce(async () => {
  await contentStore.hydrate()
})

const lightboxStore = useLightboxStore()

const { butterPages, attendeeCount } = storeToRefs(contentStore)
const runtimeConfig = useRuntimeConfig()
const fallbackEventbriteLink =
  runtimeConfig.public.eventbriteLink ||
  'https://airtable.com/applbJgB5JNe73ode/shrjsi9TQbUSHex8u'

type CmsRecord = Record<string, any>

const page = computed<CmsRecord | null>(() => {
  const record = butterPages.value?.homepage as CmsRecord | undefined
  return record ?? null
})

const eventStartDate = computed(() =>
  typeof page.value?.event_start_date === 'string' ? page.value.event_start_date : undefined,
)

const heroBackground = computed(() =>
  typeof page.value?.homepage_hero_image === 'string' ? page.value.homepage_hero_image : undefined,
)

const heroAccent = computed(() =>
  typeof page.value?.page_accent_color === 'string' ? page.value.page_accent_color : undefined,
)

const heroVideoBackground = computed(() =>
  typeof page.value?.homepage_background_video === 'string'
    ? page.value.homepage_background_video
    : undefined,
)

const heroContent = computed(() =>
  typeof page.value?.homepage_hero_content === 'string' ? page.value.homepage_hero_content : '',
)

const eventDateLabel = computed(() =>
  typeof page.value?.event_date_label === 'string' ? page.value.event_date_label : '',
)

const heroVideoId = computed(() =>
  typeof page.value?.homepage_hero_video_youtube_id === 'string'
    ? page.value.homepage_hero_video_youtube_id
    : '',
)

const whyAttendCopy = computed(() =>
  typeof page.value?.why_attend_becamp === 'string' ? page.value.why_attend_becamp : '',
)

const safeInclusiveCopy = computed(() =>
  typeof page.value?.safe_inclusive_accessible === 'string'
    ? page.value.safe_inclusive_accessible
    : '',
)

const sponsorsIntroCopy = computed(() =>
  typeof page.value?.our_awesome_sponsors === 'string' ? page.value.our_awesome_sponsors : '',
)

const whatIsBeCamp = computed<CmsRecord[]>(() =>
  Array.isArray(page.value?.what_is_becamp) ? (page.value?.what_is_becamp as CmsRecord[]) : [],
)

const sponsorshipPerks = computed(() =>
  Array.isArray(page.value?.sponsorship_perks) ? (page.value?.sponsorship_perks as any[]) : [],
)

const attendeeCountText = computed(() =>
  attendeeCount.value >= 20 ? `<strong>${attendeeCount.value}</strong>&nbsp;` : '',
)

const eventbriteUrl = computed(() => {
  const link = page.value?.eventbrite_link
  if (typeof link === 'string' && link.trim() && !link.includes('EVENTBRITE_LINIK')) {
    return link
  }
  return fallbackEventbriteLink
})

watchEffect(() => {
  if (heroAccent.value) {
    contentStore.setCurrentPageAccentColor(heroAccent.value)
  }
})

onMounted(() => {
  if (eventStartDate.value) {
    contentStore.setEventTime(eventStartDate.value)
  }
})

const youtubeVideo =
  '<div class="embed-container"><iframe src="https://www.youtube.com/embed/aVMBvWumoF8?autoplay=1&rel=0" frameborder="0" allowfullscreen autoplay="1"></iframe></div>'

const setAttendeeCount = (html: unknown) => {
  if (typeof html !== 'string') {
    return ''
  }
  return html.replace('[count] ', attendeeCountText.value)
}

const showLightbox = (content: string) => {
  lightboxStore.open(content)
}
</script>


<style scoped lang="scss">
.page-hero {
  .inner {
    display: flex;
    flex-direction: column;
    width: 95%;
    margin: auto;
    max-width: 1200px;
    @include bp($ml) {
      flex-direction: row;
      align-items: center;
      margin: auto;
    }
  }
  .event-headline {
    text-align: center;
    font-size: 1rem;
    max-width: 900px;
    font-weight: normal;
    order: 2;
    @include bp($l) {
      margin-top: -3em;
    }
    .action {
      display: block;
    }
    .action + .action {
      margin-top: gutter();
    }
  }
  .event-countdown {
    display: flex;
    flex-direction: column;
    align-items: center;
    order: 1;
    @include bp($m) {
      margin-right: 2em;
    }
    @include bp($l) {
      margin-right: 5em;
    }
  }
  .countdown-timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include bp($ml) {
      align-items: flex-start;
    }
  }
  .countdown-label {
    color: $accent;
    font-size: 4.5vw;
    margin-bottom: .75em;
    line-height: 1.2;
    font-style: italic;
    @include bp($ms) {
      font-size: 1.5em;
    }
  }
  .intro-video {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-top: 1.5em;
    img {
      max-width: 50px;
      margin-bottom: .25em;
      cursor: pointer;
      transition: transform .25s;
      &:hover {
        transform: scale(1.05);
      }
      @include bp($ml) {
        max-width: 75px;
      }
    }
    p {
      font-size: 1rem;
    }
  }
}
.what-is-becamp {
  .section-title {
    margin-bottom: 1em;
  }
}
.cta {
  font-size: 1rem;
  text-align: center;
  h2 {
    margin-bottom: .5em;
  }
}
</style>
