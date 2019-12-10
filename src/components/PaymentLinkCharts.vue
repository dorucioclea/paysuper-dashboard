<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import { get, map, reduce } from 'lodash-es';
import PaymentLinkChartsHeader from '@/components/PaymentLinkChartsHeader.vue';
import ChartsPaylinkSummary from '@/components/ChartsPaylinkSummary.vue';
import ChartsPaylinkBase from '@/components/ChartsPaylinkBase.vue';
import ChartsPaylinkUtm from '@/components/ChartsPaylinkUtm.vue';

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
  name: 'PaymentLinkCharts',
  components: {
    PaymentLinkChartsHeader,
    ChartsPaylinkSummary,
    ChartsPaylinkBase,
    ChartsPaylinkUtm,
  },
  data() {
    return {
      filters: {},
    };
  },
  props: {
    title: {
      default: 'Revenue dynamic',
      type: String,
    },
  },
  computed: {
    ...mapState('PaymentLinkCharts', [
      'date',
      'country',
      'referrer',
      'utm',
      'summary',
      'mainPeriod',
      'lastPayments',
      'currency',
    ]),
    ...mapGetters('PaymentLinkCharts', ['mainChartPeriod', 'getFilterValues']),
    ...mapGetters('Dictionaries', ['countries']),

    dateFilter: {
      get() {
        return [this.filters.dateFrom || null, this.filters.dateTo || null];
      },
      set(value) {
        const [dateFrom, dateTo] = value;
        this.filters.dateFrom = dateFrom;
        this.filters.dateTo = dateTo;
      },
    },

    mainLastBarColor() {
      return {
        gross_summary: '#3d7bf5',
        total_transactions: '#f3aa18',
        arpu: '#2fa84f',
        vat: '#ea3d2f',
      };
    },
    dateData() {
      if (!this.date) {
        return [];
      }

      const summary = reduce(this.date.top, (res, item) => {
        res.labels.push(item.date);
        res.data.push(item.gross_total_amount);

        return res;
      }, { labels: [], data: [] });

      const summaryColors = {
        backgroundColor: map(summary.data, (item, index) => {
          const isLastBar = index === summary.data.length - 1;
          return isLastBar ? '#3d7bf5' : '#e9edef';
        }),
        hoverBackgroundColor: map(summary.data, (item, index) => {
          const isLastBar = index === summary.data.length - 1;
          return isLastBar ? '#3d7bf5' : '#c5d7fc';
        }),
      };

      return {
        labels: summary.labels,
        hasChart: Boolean(summary.labels.length),
        datasets: [{
          label: '',
          ...summaryColors,
          data: summary.data,
        }],
      };
    },
    countryData() {
      return this.getData('country');
    },
    referrerData() {
      return this.getData('referrer');
    },
    utmData() {
      return this.getData('utm');
    },
  },
  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('PaymentLinkCharts', ['changePeriod', 'fetchLastPayments', 'submitFilters', 'fetchChart']),

    get,

    updateFiltersFromQuery() {
      this.filters = this.getFilterValues(['dateFrom', 'dateTo']);
    },

    async setFilters(filters) {
      this.dateFilter = filters;

      this.setIsLoading(true);
      this.submitFilters(this.filters);
      await this.fetchChart('summary').catch(this.$showErrorMessage);
      await this.fetchChart('country').catch(this.$showErrorMessage);
      await this.fetchChart('referrer').catch(this.$showErrorMessage);
      await this.fetchChart('date').catch(this.$showErrorMessage);
      await this.fetchChart('utm').catch(this.$showErrorMessage);
      this.setIsLoading(false);
    },

    getData(type) {
      if (!this[type]) {
        return [];
      }

      const chart = reduce(this[type].top, (result, chartItem) => {
        result.labels.push(chartItem.country_code || chartItem.referrer_host);
        result.data.push(chartItem.gross_total_amount);
        return result;
      }, { labels: [], data: [] });

      const colors = {
        backgroundColor: map(chart.data, (chartItem, index) => COLORS[index]),
        hoverBackgroundColor: map(chart.data, (chartItem, index) => COLORS[index]),
      };

      return {
        hasTop: Boolean((this[type].top || []).length),
        top: this[type].top || undefined,
        hasChart: Boolean(chart.labels.length),
        chart: {
          labels: chart.labels,
          datasets: [{
            label: '',
            ...colors,
            data: chart.data,
          }],
        },
      };
    },
  },

  created() {
    this.updateFiltersFromQuery();
  },
};
</script>

<template>
<div id="dashboard-charts" class="charts">
  <PaymentLinkChartsHeader
    :period="mainPeriod"
    :filters="dateFilter"
    :title="title"
    @changePeriod="changePeriod"
    @setFilters="setFilters"
  />

  <ChartsPaylinkSummary
    :chartPeriod="mainChartPeriod"
    :currency="currency"
    :data="dateData"
  />

  <ChartsPaylinkBase
    :chartPeriod="mainChartPeriod"
    :countries="countries"
    :currency="currency"
    :countryData="countryData"
    :referrerData="referrerData"
  />

  <ChartsPaylinkUtm
    :countries="countries"
    :currency="currency"
    :utmData="utmData"
  />
</div>
</template>

<style lang="scss" scoped>
.charts {
  display: flex;
  flex-direction: column;
  /deep/.box {
    box-shadow: none;
  }
}
</style>
