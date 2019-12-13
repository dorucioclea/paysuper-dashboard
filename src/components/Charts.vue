<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import { get, map, reduce } from 'lodash-es';
import print from 'print-js';
import ChartsHeader from '@/components/ChartsHeader.vue';
import ChartsMain from '@/components/ChartsMain.vue';
import ChartsRevenue from '@/components/ChartsRevenue.vue';
import ChartsBasic from '@/components/ChartsBasic.vue';
import ChartsLastPayments from '@/components/ChartsLastPayments.vue';

export default {
  name: 'Charts',
  components: {
    ChartsHeader,
    ChartsMain,
    ChartsRevenue,
    ChartsBasic,
    ChartsLastPayments,
  },
  props: {
    title: {
      default: 'Dashboard',
      type: String,
    },
  },
  computed: {
    ...mapState('Dashboard', [
      'base',
      'main',
      'revenue',
      'basePeriod',
      'mainPeriod',
      'currency',
      'lastPayments',
    ]),
    ...mapGetters('Dashboard', ['mainChartPeriod', 'baseChartPeriod']),
    ...mapGetters('Dictionaries', ['countries']),

    mainLastBarColor() {
      return {
        gross_revenue: '#3d7bf5',
        total_transactions: '#f3aa18',
        arpu: '#2fa84f',
        vat: '#ea3d2f',
      };
    },
    baseLastBarColor() {
      return {
        revenue_by_country: '#3d7bf5',
        sales_today: '#f3aa18',
        sources: '#2fa84f',
      };
    },
    revenueData() {
      const revenue = reduce(this.revenue, (res, item) => {
        res.labels.push(item.label);
        res.data.push(item.amount);

        return res;
      }, { labels: [], data: [] });

      const revenueColors = {
        backgroundColor: map(revenue.data, (item, index) => {
          const isLastBar = index === revenue.data.length - 1;
          return isLastBar ? '#3d7bf5' : '#e9edef';
        }),
        hoverBackgroundColor: map(revenue.data, (item, index) => {
          const isLastBar = index === revenue.data.length - 1;
          return isLastBar ? '#3d7bf5' : '#c5d7fc';
        }),
      };

      return {
        labels: revenue.labels,
        hasChart: Boolean(revenue.labels.length),
        datasets: [{
          label: '',
          ...revenueColors,
          data: revenue.data,
        }],
      };
    },
    mainData() {
      return this.getData('main');
    },
    baseData() {
      return this.getData('base');
    },
    getData() {
      return type => reduce(this[type], (res, item, key) => {
        const current = get(item, 'total_current', get(item, 'amount_current', item.count_current));
        const previous = get(item, 'total_previous', get(item, 'amount_previous', item.count_previous));
        const chart = reduce(item.chart, (result, chartItem) => {
          result.labels.push(chartItem.label);
          result.data.push(chartItem.value || chartItem.amount);

          return result;
        }, { labels: [], data: [] });

        const colors = {
          backgroundColor: map(chart.data, (chartItem, index) => {
            const isLastBar = index === chart.data.length - 1;
            return isLastBar ? this[`${type}LastBarColor`][key] : '#e9edef';
          }),
          hoverBackgroundColor: map(chart.data, (chartItem, index) => {
            const isLastBar = index === chart.data.length - 1;
            return isLastBar ? this[`${type}LastBarColor`][key] : '#c5d7fc';
          }),
        };

        return {
          ...res,
          [key]: {
            amount: current,
            amountPrevious: previous,
            hasIncreasedArrow: Boolean(current || previous),
            isIncreased: current > previous,
            hasTop: Boolean((item.top || []).length),
            top: item.top || undefined,
            hasChart: Boolean(chart.labels.length),
            chart: {
              labels: chart.labels,
              datasets: [{
                label: '',
                ...colors,
                data: chart.data,
              }],
            },
          },
        };
      }, {});
    },
  },
  methods: {
    ...mapActions('Dashboard', ['changePeriod', 'fetchLastPayments']),

    get,

    printDashboard() {
      print({
        printable: 'dashboard-charts',
        type: 'html',
        targetStyles: ['*'],
        maxWidth: 1200,
      });
    },
  },
};
</script>

<template>
<div id="dashboard-charts" class="charts">
  <ChartsHeader
    :period="mainPeriod"
    :title="title"
    @changePeriod="changePeriod"
    @printDashboard="printDashboard"
  />

  <ChartsMain
    :chartPeriod="mainChartPeriod"
    :currency="currency"
    :data="mainData"
  />

  <ChartsRevenue
    :chartPeriod="mainChartPeriod"
    :currency="currency"
    :data="revenueData"
  />

  <ChartsBasic
    :chartPeriod="baseChartPeriod"
    :countries="countries"
    :currency="currency"
    :data="baseData"
    :period="basePeriod"
    @changePeriod="changePeriod"
  />

  <ChartsLastPayments
    :countries="countries"
    :lastPayments="lastPayments"
    @fetchLastPayments="fetchLastPayments"
  />
</div>
</template>

<style lang="scss" scoped>
.charts {
  display: flex;
  flex-direction: column;
}
</style>
