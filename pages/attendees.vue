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
          href="https://airtable.com/applbJgB5JNe73ode/shrjsi9TQbUSHex8u"
          target="_blank" rel="noopener"
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

<script>
import {mapState, mapGetters} from 'vuex'

export default {
  middleware: 'beswarm',
  head () {
    return {
      title: 'Attendee Directory | beCamp',
      meta: [
        { hid: 'description', name: 'description', content: 'The who\'s who of beCamp. These are some of the interesting people you\'ll run into.' }
      ]
    }
  },
  created () {
    this.$store.dispatch('loadData').then(() => {
      if (this.page && this.page.page_accent_color) {
        this.$store.commit('setCurrentPageAccentColor', this.page.page_accent_color)
      }
    }).catch(error => {
      console.error('Error loading data in attendees.vue:', error);
    });
  },
  mounted () {
    if (this.directoryAttendees.length === 0) {
      this.$store.dispatch('getAttendees')
    }
  },
  computed: {
    ...mapState({
      butterPages: state => state.butterPages,
    }),
    ...mapGetters([
      'directoryAttendees'
    ]),
    page () {
      return this.butterPages['attendees'] ? this.butterPages['attendees'] : {}
    }
  }
}
</script>

<style lang="scss" scoped>
.register {
  margin-top: gutter()*2;
  font-size: 1rem;
}
</style>
