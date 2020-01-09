<template>
  <div class="label-tag" :class="`_color-${color}`">
    <slot></slot>
  </div>
</template>

<script>
import { includes } from 'lodash-es';

export default {
  name: 'UiLabelTag',

  props: {
    color: {
      type: String,
      default: 'gray',
      validator(value) {
        return includes(
          [
            'gray', 'light-gray', 'red', 'blue', 'green', 'yellow', 'purple', 'aqua', 'cyan', 'transparent',
          ],
          value,
        );
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.label-tag {
  height: 24px;
  min-width: 80px;
  box-sizing: border-box;
  padding: 0 5px;
  color: #fff;
  font-size: 12px;
  line-height: 16px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 12px;

  &._color-gray {
    background-color: #b1b1b1;
  }
  &._color-light-gray {
    background-color: #f1f3f4;
    color: #919699;
  }
  &._color-red {
    background-color: #ea3d2f;
  }
  &._color-blue {
    background-color: #3d7bf5;
  }
  &._color-green {
    background-color: #2fa84f;
  }
  &._color-yellow {
    background-color: #f3aa18;
  }
  &._color-purple {
    background-color: #7e57c2;
  }
  &._color-aqua {
    background-color: #3acfcf;
  }
  &._color-cyan {
    background-color: #069697;
  }
  &._color-transparent {
    background-color: #fff;
    border: 1px solid #e3e5e6;
    color: #919699;
  }
}
</style>
