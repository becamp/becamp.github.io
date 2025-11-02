<template>
  <div
    class="site-prompt"
    :style="styles"
    ref="prompt"
    v-show="show || shown"
  >
    <div class="inner">
      <div
        class="close"
        @click="dismiss"
      >
        <span class="icon">&times;</span>
        <span class="label"> dismiss</span>
      </div>
      <div class="content">
        <p>{{ message }}</p>

        <div class="cta">
          <a
            v-if="ctaLink"
            href="https://www.customink.com/fundraising/becamp-hat"
            target="_blank"
            rel="noopener"
            class="small"
            @click="dismiss"
            name="beCamp Hats promotion link"
          >
            <button>{{ ctaMessage }}</button>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSystemStore } from '~/stores/system'

const props = withDefaults(
  defineProps<{
    promptId: string
    message: string
    ctaLink?: string
    ctaMessage?: string
  }>(),
  {
    ctaMessage: 'Read More',
  },
)

const show = ref(false)
const shown = ref(false)
const componentHeight = ref(0)
const prompt = ref<HTMLElement | null>(null)

const systemStore = useSystemStore()
const { viewportWidth, dismissedPrompts } = storeToRefs(systemStore)

const styles = computed(() =>
  show.value
    ? {
        marginTop: 0,
      }
    : {
        marginTop: `-${componentHeight.value}px`,
      },
)

const setComponentHeight = () => {
  componentHeight.value = prompt.value?.clientHeight ?? 0
}

const dismiss = () => {
  setComponentHeight()
  show.value = false
  systemStore.dismissPrompt(props.promptId)
}

onMounted(() => {
  setComponentHeight()

  if (!dismissedPrompts.value.includes(props.promptId)) {
    show.value = true
    shown.value = true
  }
})

watch(viewportWidth, () => {
  setComponentHeight()
})
</script>

<style lang="scss" scoped>
.site-prompt {
  background-color: linear-gradient(to bottom, #fff, $light-d);
  border-bottom: 1px solid #eee;
  padding: gutter();
  transition: margin 1s;
}

.inner {
  position: relative;
  @include row();

  @include bp($m) {
    display: flex;
    flex-direction: row;
  }
}

.close {
  position: absolute;
  bottom: calc(gutter() / 4);
  right: 0;
  font-size: 1.5em;
  vertical-align: top;

  @include bp($m) {
    position: static;
    font-size: 2em;
    line-height: 1;
    min-width: 50px;
  }

  span {
    display: inline-block;
    line-height: 1rem;
    cursor: pointer;
  }

  .icon {
    position: relative;
    top: .125em;

    @include bp($m) {
      position: static;
      border: 2px solid #000;
      border-radius: 50%;
      padding: .1em;
    }
  }

  .label {
    font-size: 1.1rem;
    margin-left: .25em;

    @include bp($m) {
      display: none;
    }
  }
}

.content {
  @include bp($m) {
    display: flex;
    align-items: center;
  }

  p {
    @include bp($m) {
      margin-bottom: 0;
    }
  }

  .cta {
    @include bp($m) {
      min-width: 200px;
      text-align: right;
      padding-left: calc(gutter() / 2);
    }
  }
}

button {
  font-size: 1.5rem;
}
</style>
