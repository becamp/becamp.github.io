/**
 * Import components
 */
import braidLink from "~/components/BraidLink";
import siteHeader from "~/components/siteHeader";
import siteFooter from "~/components/siteFooter";
import pageHero from "~/components/pageHero";
import countdownClock from "~/components/countdownClock";
import mediaBlock from "~/components/mediaBlock";
import easterEgg from "~/components/easterEgg";
import iconGrid from "~/components/iconGrid";
import becampSponsors from "~/components/becampSponsors";
import sponsorCards from "~/components/sponsorCards";
import logoGrid from "~/components/logoGrid";
import htmlLightbox from "~/components/htmlLightbox";
import attendeesGrid from "~/components/attendeesGrid";
import offCanvasNav from "~/components/offCanvasNav";
import hamburgerMenu from "~/components/hamburgerMenu";
import becampSchedule from "~/components/becampSchedule";
import sitePrompt from "~/components/sitePrompt";
import newsletterSignup from "~/components/newsletterSignup";

export default defineNuxtPlugin((nuxtApp) => {
  /**
   * Register components globally.
   */
  nuxtApp.vueApp.component("braid-link", braidLink);
  nuxtApp.vueApp.component("site-header", siteHeader);
  nuxtApp.vueApp.component("site-footer", siteFooter);
  nuxtApp.vueApp.component("page-hero", pageHero);
  nuxtApp.vueApp.component("countdown-clock", countdownClock);
  nuxtApp.vueApp.component("media-block", mediaBlock);
  nuxtApp.vueApp.component("easter-egg", easterEgg);
  nuxtApp.vueApp.component("icon-grid", iconGrid);
  nuxtApp.vueApp.component("becamp-sponsors", becampSponsors);
  nuxtApp.vueApp.component("sponsor-cards", sponsorCards);
  nuxtApp.vueApp.component("logo-grid", logoGrid);
  nuxtApp.vueApp.component("html-lightbox", htmlLightbox);
  nuxtApp.vueApp.component("attendees-grid", attendeesGrid);
  nuxtApp.vueApp.component("off-canvas-nav", offCanvasNav);
  nuxtApp.vueApp.component("hamburger-menu", hamburgerMenu);
  nuxtApp.vueApp.component("becamp-schedule", becampSchedule);
  nuxtApp.vueApp.component("site-prompt", sitePrompt);
  nuxtApp.vueApp.component("newsletter-signup", newsletterSignup);
});
