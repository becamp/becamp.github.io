/**
 * Import components
 */
import { defineNuxtPlugin } from 'nuxt/app'
import braidLink from '~/components/BraidLink.vue'
import siteHeader from '~/components/siteHeader.vue'
import siteFooter from '~/components/siteFooter.vue'
import pageHero from '~/components/pageHero.vue'
import countdownClock from '~/components/countdownClock.vue'
import mediaBlock from '~/components/mediaBlock.vue'
import easterEgg from '~/components/easterEgg.vue'
import iconGrid from '~/components/iconGrid.vue'
import becampSponsors from '~/components/becampSponsors.vue'
import sponsorCards from '~/components/sponsorCards.vue'
import logoGrid from '~/components/logoGrid.vue'
import htmlLightbox from '~/components/htmlLightbox.vue'
import attendeesGrid from '~/components/attendeesGrid.vue'
import offCanvasNav from '~/components/offCanvasNav.vue'
import hamburgerMenu from '~/components/hamburgerMenu.vue'
import becampSchedule from '~/components/becampSchedule.vue'
import sitePrompt from '~/components/sitePrompt.vue'
import newsletterSignup from '~/components/newsletterSignup.vue'

export default defineNuxtPlugin((nuxtApp) => {
  /**
   * Register components globally.
   */
  nuxtApp.vueApp.component('braid-link', braidLink)
  nuxtApp.vueApp.component('site-header', siteHeader)
  nuxtApp.vueApp.component('site-footer', siteFooter)
  nuxtApp.vueApp.component('page-hero', pageHero)
  nuxtApp.vueApp.component('countdown-clock', countdownClock)
  nuxtApp.vueApp.component('media-block', mediaBlock)
  nuxtApp.vueApp.component('easter-egg', easterEgg)
  nuxtApp.vueApp.component('icon-grid', iconGrid)
  nuxtApp.vueApp.component('becamp-sponsors', becampSponsors)
  nuxtApp.vueApp.component('sponsor-cards', sponsorCards)
  nuxtApp.vueApp.component('logo-grid', logoGrid)
  nuxtApp.vueApp.component('html-lightbox', htmlLightbox)
  nuxtApp.vueApp.component('attendees-grid', attendeesGrid)
  nuxtApp.vueApp.component('off-canvas-nav', offCanvasNav)
  nuxtApp.vueApp.component('hamburger-menu', hamburgerMenu)
  nuxtApp.vueApp.component('becamp-schedule', becampSchedule)
  nuxtApp.vueApp.component('site-prompt', sitePrompt)
  nuxtApp.vueApp.component('newsletter-signup', newsletterSignup)
})
