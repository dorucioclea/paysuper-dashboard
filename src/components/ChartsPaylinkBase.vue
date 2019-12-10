<script>
import { get, find, merge } from 'lodash-es';
import Barchart from '@/components/Barchart.vue';
import getBarchartOptionsByType from '@/helpers/getBarchartOptionsByType';

const COLORS = [
  '#F44336',
  '#FF9800',
  '#FFEB3B',
  '#8BC34A',
  '#009688',
  '#00BCD4',
  '#03A9F4',
  '#3F51B5',
  '#795548',
  '#E3E5E6',
];

export default {
  name: 'ChartsPaylinkBase',
  components: { Barchart },
  props: {
    chartPeriod: {
      default: () => ({}),
      type: Object,
    },
    countries: {
      default: () => [],
      type: Array,
    },
    currency: {
      default: 'USD',
      type: String,
    },
    countryData: {
      default: () => ({}),
      type: Object,
    },
    referrerData: {
      default: () => ({}),
      type: Object,
    },
  },
  computed: {
    countriesOptions() {
      return merge(
        getBarchartOptionsByType('basePaymentLink'),
        { scales: { xAxes: [{ time: { ...this.chartPeriod } }] } },
      );
    },
    referrersOptions() {
      return merge(
        getBarchartOptionsByType('basePaymentLink'),
        { scales: { xAxes: [{ time: { ...this.chartPeriod } }] } },
      );
    },
  },
  methods: {
    getCountryByCode(code) {
      return get(find(this.countries, ({ value }) => value === code), 'label', code);
    },
    get,
    getColor(index) {
      return COLORS[index];
    },
  },
};
</script>

<template>
<div class="charts-basic">
  <div class="box">
    <div class="basic">
      <div class="basic-item">
        <Barchart
          type="doughnut"
          v-if="get(countryData, 'hasChart')"
          class="chart"
          :data="get(countryData, 'chart')"
          :options="countriesOptions"
        />
        <div class="basic-title">Top countries</div>
        <div
          v-if="get(countryData, 'top')"
          class="top"
        >
          <div
            v-for="(item, index) in get(countryData, 'top')"
            :key="index"
            class="top-item"
          >
            <div class="country">
              <span class="status-dot"
                :style="{ 'background-color': getColor(index) }"
              />
              <span class="text">{{ getCountryByCode(item.country_code) }}</span>
            </div>
            <div class="amount">
              {{ $formatPrice(item.gross_total_amount, currency) }}
            </div>
          </div>
        </div>
      </div>
      <div class="basic-item">
        <Barchart
          type="doughnut"
          v-if="get(referrerData, 'hasChart')"
          class="chart"
          :data="get(referrerData, 'chart')"
          :options="referrersOptions"
        />
        <div class="basic-title">Best referrers</div>
        <div
          v-if="get(referrerData, 'top')"
          class="top"
        >
          <div
            v-for="(item, index) in get(referrerData, 'top')"
            :key="index"
            class="top-item"
          >
            <div class="country">
              <span class="status-dot"
               :style="{ 'background-color': getColor(index) }"
              />
              <span class="text">{{ item.referrer_host }}</span>
            </div>
            <div class="amount">{{ item.sales_count }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
.charts-basic {
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
  box-shadow: 0px 1px 2px rgba(8, 35, 48, 0.24), 0px 2px 6px rgba(8, 35, 48, 0.16);
  border-radius: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  padding: 30px 24px 20px;
}
.value {
  font-family: Quicksand;
  color: #000;
  font-size: 24px;
  line-height: 30px;
  padding-right: 16px;
  display: flex;
  align-items: center;
}
.arrow {
  margin-left: 10px;

  &._is-decreased {
    fill: #ea3d2f;
    transform: rotate(180deg);
  }
}
.additional {
  color: #919699;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.4px;
}
.chart {
  height: 120px;
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
.basic {
  display: flex;
  justify-content: space-between;
  flex-basis: 100%;
  flex-wrap: wrap;
}
.basic-item {
  display: flex;
  flex-wrap: wrap;
  flex-basis: calc(33% - 30px);
  align-self: flex-start;

  & > .value,
  & > .additional {
    flex-basis: 100%;
    white-space: nowrap;
  }
  & > .value {
    margin-bottom: 8px;
  }
}
.basic-title {
  font-family: Roboto;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.44px;
  color: #000;
  margin: 22px 0 8px;
  flex-basis: 100%;
  white-space: nowrap;
  text-align: center;
}
.top {
  display: flex;
  flex-wrap: wrap;
  flex-basis: 100%;
  flex-grow: 1;
}
.top-title,
.top-item {
  display: flex;
  align-items: center;
  flex-basis: 100%;
  height: 40px;
}
.top-title {
  font-family: Roboto;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.4px;
  color: #919699;
}
.top-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  font-family: Roboto;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.25px;
  color: #000;
  border-top: 1px solid #e3e5e6;
}
.country {
  position: relative;
  text-align: left;
  & .text {
    padding-left: 12px;
    display: inline-block;
    width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  box-sizing: border-box;
  display: inline-block;
  position: absolute;
  top: 50%;
  margin-top: -5px;
}
</style>
