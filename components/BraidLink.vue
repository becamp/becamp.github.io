<template>
  <NuxtLink
    :to="to"
    class="braid-link"
    :class="{'active': active}"
  >
    <slot />
  </NuxtLink>
</template>

<script>
export default {
  props: {
    to: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
.braid-link {
  text-decoration: none;
  color: inherit;

  &.active {
    text-decoration: underline;
  }
}
</style>
