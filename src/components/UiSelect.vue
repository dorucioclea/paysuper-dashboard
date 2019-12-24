<template>
<div
  v-clickaway="blur"
  :class="selectClasses"
>
  <div
    class="wrapper"
    @click="focused ? blur() : focus()"
  >
    <span
      v-if="label"
      class="label"
      :class="{ '_required': required }"
      :title="label"
    >
      {{ label }}
    </span>
    <span class="selected">
      {{ selectedLabel }}
    </span>
  </div>
  <span
    v-if="isVisibleError"
    :class="['error', `_${errorColor}`]"
    :title="errorText"
  >
    {{ errorText }}
  </span>
  <span
    v-if="additionalInfo"
    class="additional"
    :title="additionalInfo"
  >
    {{ additionalInfo }}
  </span>
  <div class="box">
    <div class="options" v-if="focused">
      <UiScrollbarBox
        class="scrollbox"
        :style="{ maxHeight }"
      >
        <label
          v-for="option in optionsView"
          :key="option.value"
          class="option"
          :class="{
            '_empty': option.value === '',
            '_current': selectValue === option.value
          }"
        >
          {{ option.label }}
          <input
            v-model="selectValue"
            class="input"
            name="selectValue"
            type="radio"
            :required="required"
            :value="option.value"
            @change="emitChange"
          >
        </label>
      </UiScrollbarBox>
    </div>
  </div>
</div>
</template>

<script>
import { directive as clickaway } from 'vue-clickaway';
import { find, includes, debounce } from 'lodash-es';
import inView from 'in-view';


export default {
  directives: {
    clickaway,
  },
  props: {
    additionalInfo: {
      default: '',
      type: String,
    },
    disabled: {
      default: false,
      type: Boolean,
    },
    label: {
      default: '',
      type: String,
    },
    options: {
      default: () => [],
      type: Array,
      validator(value) {
        if (!value.length) {
          return true;
        }
        if (value[0].label !== undefined && value[0].value !== undefined) {
          return true;
        }
        return false;
      },
    },
    required: {
      default: false,
      type: Boolean,
    },
    maxHeight: {
      default: '200px',
      type: String,
    },
    value: {
      default: '',
      type: [String, Number],
    },
    hasEmptyValue: {
      default: false,
      type: Boolean,
    },
    placeholder: {
      default: '',
      type: String,
    },
    errorText: {
      default: '',
      type: String,
    },
    hasError: {
      default: false,
      type: Boolean,
    },
    errorColor: {
      default: 'red',
      type: String,
      validator(value) {
        return includes(['red', 'black'], value);
      },
    },
  },
  data() {
    return {
      selectValue: this.value,
      focused: false,
      isDropUp: false,
    };
  },
  computed: {
    /**
     * Classes for select
     * @return {Array<string>}
     */
    selectClasses() {
      return [
        'select-field',
        this.isVisibleError ? '_error' : '',
        this.focused ? '_focused' : '',
        this.selectValue === '' ? '_empty' : '',
        this.disabled ? '_disabled' : '',
        this.isDropUp ? '_dropup' : '',
      ];
    },

    selectedLabel() {
      const selectedItem = find(this.options, { value: this.selectValue });
      return selectedItem ? selectedItem.label : this.placeholder;
    },

    optionsView() {
      if (this.hasEmptyValue) {
        return [
          {
            label: this.placeholder,
            value: '',
          },
          ...this.options,
        ];
      }

      return this.options;
    },

    /**
     * Error is visible if it exists and error text isn't empty
     * @return {boolean}
     */
    isVisibleError() {
      return !!(this.hasError && this.errorText);
    },
  },
  watch: {
    value(val) {
      this.selectValue = val;
    },
  },

  mounted() {
    this.computeDropup();
    window.addEventListener('scroll', this.onScroll);
  },

  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll);
  },

  methods: {
    emitChange({ target: { value } }) {
      this.$emit('input', value);
      this.blur();
    },
    focus() {
      this.computeDropup();
      this.focused = true;
    },
    blur() {
      if (this.focused) {
        this.$emit('blur');
        this.focused = false;
      }
    },

    computeDropup() {
      this.isDropUp = !inView.is(this.$el);
    },

    // eslint-disable-next-line
    onScroll: debounce(function () {
      window.requestAnimationFrame(() => {
        this.computeDropup();
      });
    }, 100),
  },
};
</script>

<style scoped lang="scss">
/** @TODO - move to gui for typographics */
$input-background-color: #fff;
$primary-input-color: #333;
$secondary-input-color: #5e6366;
$focus-input-color: #3787ff;
$error-input-color: #ff6f6f;
$hover-option-color: rgba($focus-input-color, 0.1);
$selected-color: #c6cacc;

$primary-input-size: 16px;
$secondary-input-size: 12px;
$left-indent: 12px;

.select-field {
  background-color: $input-background-color;
  box-sizing: border-box;
  color: $primary-input-color;
  display: inline-block;
  vertical-align: top;
  font-size: $primary-input-size;
  padding: 24px 0;
  position: relative;
  width: 100%;

  &._dropup {
    .box {
      top: auto;
      bottom: 100%;
      margin-bottom: 2px;
      transform-origin: bottom;
    }
  }

  &._focused {
    pointer-events: auto;

    .box {
      transform: scaleY(1);
    }

    .label {
      color: $focus-input-color;
    }

    .wrapper {
      &:after {
        transform: rotate(180deg);
        transform-origin: top center;
        border-top-color: $selected-color;
        margin-top: 5px;
      }
    }
    .selected {
      border-color: $focus-input-color;
    }
  }

  &._error {
    &._focused .label {
      color: $error-input-color;
    }

    .wrapper {
      &:after {
        border-top-color: $error-input-color;
      }
    }
    .selected {
      border-color: $error-input-color;
    }
  }

  &._disabled {
    color: $secondary-input-color;
    pointer-events: none;
  }
}
.wrapper {
  cursor: pointer;

  &:after {
    content: "";
    position: absolute;
    right: 17px;
    top: 38px;
    border: 5px solid transparent;
    border-top: 5px solid $focus-input-color;

    .select-field._disabled & {
      border-top-color: #c6cacc;
    }
  }
}
.selected {
  display: block;
  height: 38px;
  line-height: 32px;
  transform-origin: bottom;
  transition: transform 0.2s ease-out;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  padding-left: $left-indent;
  border-bottom: 1px solid #e5e5e5;
}
.box {
  background-color: $input-background-color;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.1);
  left: 0px;
  position: absolute;
  z-index: 10;
  text-overflow: ellipsis;
  top: 64px;
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.2s ease-out;
  white-space: nowrap;
  width: 100%;
  border-radius: 4px;
}
.options {
  background-color: $input-background-color;
  overflow: hidden;
  width: 100%;
  border-radius: 4px;
}
.scrollbox {
  width: 100%;
  height: 100%;
}
.option {
  cursor: pointer;
  display: block;
  height: 40px;
  line-height: 40px;
  padding: 0 16px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover:not(._current) {
    background-color: $hover-option-color;
    color: #3d7bf5;
  }

  &._current {
    color: $selected-color;
    cursor: default;
  }

  &._empty {
    color: $secondary-input-color;
  }
}
.input {
  height: 0px;
  visibility: hidden;
  width: 0px;
}
.additional,
.label {
  display: block;
  color: $secondary-input-color;
  line-height: 32px;
  margin: 0;
  position: absolute;
}
.label {
  font-size: $primary-input-size;
  left: 0;
  top: 6px;
  width: 100%;
  height: 32px;
  font-size: 12px;
  line-height: 16px;
  margin-left: $left-indent;

  &._required {
    &:after {
      content: "*";
      color: #ea3d2f;
    }
  }
}
.additional {
  font-size: $secondary-input-size;
  max-width: 50%;
  right: 0;
  top: 0;
}
.error {
  left: $left-indent;
  display: block;
  font-size: $secondary-input-size;
  position: absolute;
  padding-top: 4px;

  &._red {
    color: $error-input-color;
  }

  &._black {
    color: #333;
  }
}
</style>
