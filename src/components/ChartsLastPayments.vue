<script>
import { get, find } from 'lodash-es';

export default {
  name: 'ChartsLastPayments',
  props: {
    countries: {
      default: () => [],
      type: Array,
    },
    lastPayments: {
      default: () => [],
      type: Array,
    },
  },
  data() {
    return {
      paymentsCount: 30,
    };
  },
  computed: {
    paymentsSettings() {
      return [
        { label: 'Show last 30 payments', value: 30 },
        { label: 'Show last 60 payments', value: 60 },
        { label: 'Show last 90 payments', value: 90 },
      ];
    },
  },
  methods: {
    get,

    changePaymentsCount(count) {
      this.paymentsCount = count;
      this.$emit('fetchLastPayments', count);
    },
    getProjectName(project) {
      return get(
        project,
        `name.${this.$i18n.locale}`,
        get(project, 'notify_emails.0', get(project, 'merchant_id')),
      );
    },
    getCountryByCode(code) {
      return get(find(this.countries, ({ value }) => value === code), 'label', code);
    },
  },
};
</script>

<template>
<div class="charts-payments">
  <div class="box">
    <div class="box-header">
      <div class="box-title">Last payments</div>
      <UiSelectAsButton
        iconComponent="IconSettings"
        :isOnlyIcon="true"
        :options="paymentsSettings"
        :value="paymentsCount"
        :isTransparent="true"
        @input="changePaymentsCount"
      />
    </div>

    <UiScrollbarBox class="scrollbox">
      <UiTable class="table">
        <UiTableRow :isHead="true">
          <UiTableCell align="left">Transaction</UiTableCell>
          <UiTableCell align="left">Project</UiTableCell>
          <UiTableCell align="left">Country</UiTableCell>
          <UiTableCell align="left">Amount</UiTableCell>
          <UiTableCell align="left">Date</UiTableCell>
          <UiTableCell align="left">User</UiTableCell>
        </UiTableRow>
        <UiTableRow
          v-for="order in lastPayments"
          :key="order.uuid"
        >
          <UiTableCell align="left">
            {{ order.transaction }}
          </UiTableCell>
          <UiTableCell align="left">
            {{ getProjectName(order.project) }}
          </UiTableCell>
          <UiTableCell align="left">
            {{ getCountryByCode(order.country_code) }}
          </UiTableCell>
          <UiTableCell align="left" class="cyan">
            {{ $formatPrice(order.total_payment_amount, order.currency) }}
          </UiTableCell>
          <UiTableCell align="left">
            {{ $formatDate(get(order, 'created_at.seconds')) }}
          </UiTableCell>
          <UiTableCell align="left">
            {{ get(order, 'user.name') || get(order, 'user.email') }}
          </UiTableCell>
        </UiTableRow>
      </UiTable>
    </UiScrollbarBox>
  </div>
</div>
</template>

<style lang="scss" scoped>
.charts-payments {
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
  box-shadow: 0px 1px 2px rgba(8, 35, 48, 0.24),
    0px 2px 6px rgba(8, 35, 48, 0.16);
  border-radius: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  height: 570px;
  padding: 24px;
  overflow: hidden;
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
.scrollbox {
  width: 100%;
  height: 100%;
  margin-top: 12px;
}
.table {
  padding-right: 20px;
  margin-bottom: 40px;
}
.cyan {
  color: #069697;
}
</style>
