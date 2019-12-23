<script>
import { merge } from 'lodash-es';
import Barchart from '@/components/Barchart.vue';
import getBarchartOptionsByType from '@/helpers/getBarchartOptionsByType';

export default {
  name: 'ChartsPaylinkSummary',
  components: { Barchart },
  props: {
    chartPeriod: {
      default: () => ({}),
      type: Object,
    },
    currency: {
      default: 'USD',
      type: String,
    },
    data: {
      default: () => ({}),
      type: Object,
    },
  },
  computed: {
    chartOptions() {
      return merge(
        getBarchartOptionsByType('summary'),
        {
          scales: { xAxes: [{ time: { ...this.chartPeriod } }] },
          tooltips: { callbacks: { label: ({ yLabel }) => `${yLabel} ${this.currency}` } },
        },
      );
    },
  },
};
</script>

<template>
  <div
    v-if="data.hasChart"
    class="charts-paymentlink-summary"
  >
    <div class="box">
      <Barchart
        :data="data"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .charts-paylink-summary {
    display: flex;
    flex-grow: 1;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }
  .box {
    display: flex;
    justify-content: space-between;
    flex-basis: 100%;
    background-color: #fff;
    border-radius: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    height: 315px;
    padding: 0;
  }
  .box-header {
    display: flex;
    flex-basis: 100%;
    justify-content: space-between;
  }
  .box-title {
    color: #000;
    font-family: Quicksand;
    font-weight: 500;
    font-size: 20px;
    line-height: 28px;
    letter-spacing: 0.15px;
    margin-right: 16px;
  }
</style>
