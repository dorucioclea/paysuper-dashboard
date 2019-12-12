<script>
export default {
  name: 'ChartsHeaderPaymentLink',
  data() {
    return {
      dateFilters: [],
    };
  },
  props: {
    period: {
      default: 'current_month',
      type: String,
    },
    filters: {
      default: () => [],
      type: Array,
    },
    title: {
      default: 'Revenue dynamic',
      type: String,
    },
  },
  computed: {
    periods() {
      return [
        { label: 'This month', value: 'current_month' },
        { label: 'Previous month', value: 'previous_month' },
        { label: 'This quarter', value: 'current_quarter' },
        { label: 'Previous quarter', value: 'previous_quarter' },
        { label: 'This year', value: 'current_year' },
        { label: 'Previous year', value: 'previous_year' },
      ];
    },
  },

  mounted() {
    this.dateFilters = this.filters;
  },
};
</script>

<template>
<div class="charts-header-payment-link">
  <UiHeader level="3">
    {{ title }}
  </UiHeader>
  <div class="controls">
    <UiSelectAsButton
      color="transparent-gray"
      size="small"
      :options="periods"
      :value="period"
      :isTransparent="true"
      @input="$emit('changePeriod', { type: 'main', period: $event })"
    />
  </div>
</div>
</template>

<style lang="scss" scoped>
.charts-header-payment-link {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-grow: 1;
  align-items: center;
}
.controls {
  display: flex;
  align-items: center;
}
.print {
  margin-left: 8px;
}
</style>
