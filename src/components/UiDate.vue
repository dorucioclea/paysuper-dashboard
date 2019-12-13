<script>
import insureTimestampInMiliseconds from '@/helpers/insureTimestampInMiliseconds';

export default {
  name: 'UiDate',

  props: {
    /**
    * API handles timestamp in seconds only
    * while datepicker handles in miliseconds only
    */
    value: {
      type: Number,
      default: () => null,
    },

    disabled: {
      default: false,
      type: Boolean,
    },
    errorText: {
      default: '',
      type: String,
    },
    hasError: {
      default: false,
      type: Boolean,
    },
    label: {
      default: '',
      type: String,
    },
    required: {
      default: false,
      type: Boolean,
    },
  },

  computed: {
    /**
     * Error is visible if it exists and error text isn't empty
     * @return {boolean}
     */
    isVisibleError() {
      return !!(this.hasError && this.errorText);
    },

    /**
     * Classes for input
     * @return {Array<string>}
     */
    inputClasses() {
      const isEmpty = !this.inputValue && this.inputValue !== 0;
      return [
        'input',
        isEmpty ? '_empty' : '',
        this.isVisibleError ? '_error' : '',
        this.disabled ? '_disabled' : '',
        this.required ? '_required' : '',
      ];
    },
    valueInMilseconds() {
      if (this.value === null) {
        return null;
      }
      return insureTimestampInMiliseconds(this.value);
    },
  },

  methods: {
    handleChangeValue(value) {
      if (value === null) return;
      const formattedValue = Number((value / 1000).toFixed(0));

      this.$emit('input', formattedValue);
    },
  },
};
</script>

<template>
  <div class="ui-date"
    :class="inputClasses"
    >
    <label
      class="label"
      :title="label"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <v-datepicker
      class="ui-date-datepicker"
      format="MMM DD YYYY"
      lang="en"
      rangeSeparator="·"
      valueType="timestamp"
      :value="valueInMilseconds"
      :editable="false"
      :disabled="disabled"
      :range="false"
      @input="handleChangeValue"
      @clear="handleChangeValue"
    />
    <span
      v-if="isVisibleError"
      class="error"
      :title="errorText"
    >
      {{ errorText }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
/** @TODO - move to gui for typographics */
$input-background-color: #fff;
$primary-input-color: #000000;
$secondary-input-color: #5e6366;
$focus-input-color: #3787ff;
$error-input-color: #ff6f6f;

$primary-input-size: 16px;
$secondary-input-size: 11px;
$left-indent: 12px;

.ui-date {
  display: inline-block;
  padding: 24px 0 12px;
  position: relative;
  width: 100%;

  .ui-date-datepicker {
    width: 100%;
  }

  &:focus {
    border-color: $focus-input-color;
  }

  &:focus .label {
    pointer-events: auto;
    color: $focus-input-color;
  }
  &:not(:focus):not(._empty) .label {
    color: $secondary-input-color;
  }

  &._error {
    &:focus .label {
      color: $error-input-color;
    }

    border-color: $error-input-color;
  }

  &._disabled {
    color: $secondary-input-color;
    pointer-events: none;
  }

  &._required .label {
    &:after {
      content: "*";
    }
  }

  /deep/ {
    .mx-input-wrapper {
      height: 40px;
    }
    .mx-input {
      height: 40px;
      border: 1px solid #e3e5e6;
      box-shadow: none;
      color: #000;

      &::placeholder {
        color: #c6cacc;
      }
    }

    .mx-input-icon,
    .mx-calendar-icon {
      color: #78909c;
    }
  }
}
.label {
  font-size: $primary-input-size;
  position: relative;
  width: 100%;
  margin-left: 11px;
  font-size: 12px;
  line-height: 16px;

  &:after {
    color: #ea3d2f;
  }
}
.error {
  margin-left: $left-indent;
  color: $error-input-color;
  display: block;
  font-size: $secondary-input-size;
  line-height: $secondary-input-size;
  position: relative;
  top: $secondary-input-size/2;
}
</style>
