<script>
export default {
  name: 'UiPageHeaderFrame',
  props: {
    pictureGrow: {
      default: true,
      type: Boolean,
    },
  },
  computed: {
    grow() {
      return this.pictureGrow ? '1' : '0';
    },
  },
};
</script>

<template>
<header class="simple-page-header">
  <div class="header-texts">
    <UiHeader level="2" :hasMargin="true">
      <slot name="title"></slot>
    </UiHeader>
    <p class="text">
      <slot name="description"></slot>
    </p>
  </div>
  <div class="header-picture"
    :class="`grow_${grow}`"
  >
    <slot name="picture"></slot>
  </div>
</header>
</template>

<style lang="scss" scoped>
.simple-page-header {
  margin-bottom: 32px;
  display: flex;
}
.header-picture {
  display: none;
  justify-content: center;
  &.grow_1 {
    flex-grow: 1;
  }
  &.grow_0 {
    flex-grow: 0;
  }
  @media screen and (min-width: 768px) {
    display: flex;
  }
}
.text {
  max-width: 448px;
  color: #5e6366;
}
</style>
