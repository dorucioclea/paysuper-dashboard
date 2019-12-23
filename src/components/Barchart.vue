<script>
import Chart from '@/helpers/roundedBarCharts';

export default {
  props: {
    type: {
      default: 'roundedBar',
      type: String,
    },
    data: {
      default: () => ({}),
      type: Object,
    },
    options: {
      default: () => ({}),
      type: Object,
    },
  },
  data() {
    return {
      chart: null,
    };
  },
  mounted() {
    this.createChart();
  },
  methods: {
    createChart() {
      const ctx = this.$refs.chart;
      this.chart = new Chart(ctx, {
        type: this.type,
        data: this.data,
        options: this.options,
      });
    },
  },
  watch: {
    data(value) {
      this.chart.options = this.options;
      this.chart.data = value;
      this.chart.update();
    },
  },
};
</script>

<template>
<div class="chart-container">
  <canvas class="chart-container__canvas" ref="chart"></canvas>
</div>
</template>

<style lang="scss" scoped>
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
  &__canvas {
    position: relative;
    bottom: -1px;
  }
}
</style>
