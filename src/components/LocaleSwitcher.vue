<script>
import { directive as clickaway } from 'vue-clickaway';
import { includes } from 'lodash-es';
import locales from '@/locales/scheme';

export default {
  directives: {
    clickaway,
  },
  props: {
    listColor: {
      default: 'transparent',
      type: String,
      validator(val) {
        return includes(['transparent', 'white'], val);
      },
    },
  },
  data() {
    return {
      isOpened: false,
      timeoutId: 0,
      locales,
    };
  },
  methods: {
    hide() {
      this.isOpened = false;
    },
    show() {
      this.isOpened = true;
    },
    toggle() {
      if (this.isOpened) {
        this.hide();
      } else {
        this.show();
      }
    },
    changeLocale(locale) {
      this.$i18n.locale = locale;
    },
  },
};
</script>

<template>
<div
  class="locale-switcher"
  :class="{ '_opened': isOpened }"
  v-clickaway="hide"
>
  <span
    class="selected"
    @click="toggle"
  >
    <svg width="10" height="5" viewBox="0 0 10 5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0L5 5L10 0L0 0Z" />
    </svg>

    {{ $i18n.locale }}
  </span>
  <div
    :class="['langs-list', `_${listColor}`]"
    @click="hide"
  >
    <div
      class="item"
      v-for="(locale, localeCode) in locales"
      :key="localeCode"
      :class="{ '_selected': $i18n.locale === localeCode }"
      @click="changeLocale(localeCode)"
    >{{ locale.label }}</div>
  </div>
</div>

</template>

<style scoped lang="scss">
$normal-text-color: #3e4345;
$selected-text-color: #c6cacc;
$hover-text-color: #3d7bf5;
$hover-background-color: rgba($hover-text-color, 0.1);

.locale-switcher {
  position: relative;
}

.selected {
  font-size: 14px;
  line-height: 20px;
  color: $normal-text-color;
  cursor: pointer;
  display: flex;
  align-items: center;
  text-transform: uppercase;

  svg {
    margin-right: 9px;
    fill: $normal-text-color;
  }

  .locale-switcher._opened & {
    color: $selected-text-color;

    svg {
      fill: $selected-text-color;
      transform: rotateX(180deg);
    }
  }
}

.langs-list {
  position: absolute;
  border-radius: 4px;
  padding: 5px 0;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s ease-out;
  z-index: 20;
  cursor: auto;
  right: 0;
  transform: translate3d(0, 20px, 0);
  top: calc(100% + 10px);
  width: 180px;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);

  &._white {
    background-color: #fff;
  }

  .locale-switcher._opened & {
    pointer-events: auto;
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.item {
  font-size: 14px;
  line-height: 20px;
  color: #000000;
  cursor: pointer;
  padding: 5px 20px;
  transition: all 0.2s ease-out;

  &:hover:not(._selected) {
    background: $hover-background-color;
    color: $hover-text-color;
  }

  &._selected {
    color: $selected-text-color;
    cursor: default;
  }
}
</style>
