<script>
import insureTimestampInMiliseconds from '@/helpers/insureTimestampInMiliseconds';

export default {
  name: 'UiFilterDate',

  props: {
    /**
     * API handles timestamp in seconds only
     * while datepicker handles in miliseconds only
     */
    value: {
      // Example: [1567976400, 1567976400]
      type: Array,
      default: () => [null, null],
    },
  },

  computed: {
    valueInMilseconds() {
      if (!Array.isArray(this.value) || this.value.length !== 2) {
        return [null, null];
      }

      return this.value.map(item => insureTimestampInMiliseconds(item));
    },
  },

  methods: {
    handleChangeValue(value) {
      const formattedValue = value.map((item) => {
        if (!item) {
          return null;
        }
        return Number((item / 1000).toFixed(0));
      });
      this.$emit('input', formattedValue);
    },
  },
};
</script>

<template>
<v-datepicker
  class="ui-filter-date"
  format="MMM DD YYYY"
  lang="en"
  rangeSeparator="·"
  valueType="timestamp"
  :value="valueInMilseconds"
  :editable="false"
  :range="true"
  @input="handleChangeValue"
/>
</template>

<style lang="scss" scoped>
.ui-filter-date {
  max-width: 232px;

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
</style>
