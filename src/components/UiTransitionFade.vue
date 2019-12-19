<script>
export default {
  name: 'UiTransitionFade',

  props: {
    time: {
      type: String,
      default: '0.3s',
    },
  },
};
</script>

<template>
<transition
  :enter-class="$style.enter"
  :enter-active-class="$style.enterActive"
  :enter-to-class="$style.enterTo"
  :leave-class="$style.leave"
  :leave-active-class="$style.leaveActive"
  :leave-to-class="$style.leaveTo"
>
  <slot />
</transition>
</template>

<style lang="scss" module>
.enter,
.leaveTo {
  opacity: 0;
}
.enterTo,
.leave {
  opacity: 1;
}
.enterActive,
.leaveActive {
  transition: opacity 0.3s ease-in-out;
}
</style>
