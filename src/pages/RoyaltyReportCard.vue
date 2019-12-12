<script>
import { mapActions, mapState, mapGetters } from 'vuex';
import { format } from 'date-fns';
import {
  get, find,
} from 'lodash-es';
import ReportCardStore from '@/store/ReportCardStore';
import ReportDispute from '@/components/ReportDispute.vue';
import ExportModal from '@/components/ExportModal.vue';

const STATUS_COLOR = {
  pending: 'yellow',
  accepted: 'green',
  waiting_payment: 'green',
  paid: 'aqua',
  dispute: 'red',
  canceled: 'transparent',
};

const STATUS = {
  pending: 'pending',
  accepted: 'confirmed',
  waiting_payment: 'paying',
  paid: 'paid',
  dispute: 'dispute',
  canceled: 'canceled',
};

export default {
  name: 'RoyaltyReportCard',
  components: {
    ReportDispute,
    ExportModal,
  },

  data() {
    return {
      colors: STATUS_COLOR,
      showDisputeModal: false,
      showExportModal: false,
      reportTabs: [
        { label: 'Summary', value: 'sum' },
        { label: 'Transactions report', value: 'trans' },
      ],
      currentTab: 0,
    };
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('ReportCard', ReportCardStore, {
        reportId: route.params.reportId,
      }).catch(this.$showErrorMessage);
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  computed: {
    ...mapState('ReportCard', [
      'report',
      'transactionsList',
    ]),
    ...mapGetters('User', ['userPermissions']),
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('ReportCard', [
      'acceptReport',
      'dispute',
    ]),
    ...mapActions('ExportFile', [
      'createReportFile',
      'initWaitingFile',
    ]),

    formatDateAndTime(seconds) {
      const datetime = new Date(seconds * 1000);
      return format(datetime, 'dd.MM.yyyy, HH:mm:ss');
    },

    getStatus(status) {
      return STATUS[status];
    },

    getFormattedDate(item) {
      return format(item * 1000, 'dd MMM yyyy');
    },

    async confirmReport() {
      this.setIsLoading(true);
      await this.acceptReport()
        .then(this.$showSuccessMessage('Report confirmed'))
        .catch(this.$showErrorMessage);
      this.setIsLoading(false);
    },

    openDispute() {
      this.showDisputeModal = true;
    },

    async declineReport(reason) {
      this.setIsLoading(true);
      this.showDisputeModal = false;
      await this.dispute(reason)
        .then(this.$showSuccessMessage('Report disputed'))
        .catch(this.$showErrorMessage);
      this.setIsLoading(false);
    },

    getValue(item, path) {
      return get(item, path) || '—';
    },

    returnColorAmount(status) {
      return status === 'paid' ? '#069697' : '#3E4345';
    },

    getColor(status) {
      return STATUS_COLOR[status];
    },

    getProductName(items) {
      if (items === null) {
        return 'Checkout';
      }

      if (items.length > 1) {
        return 'Product';
      }

      return items[0].name;
    },

    getCountryByCode(code) {
      return get(find(this.countries, ({ value }) => value === code), 'label', code);
    },

    async exportFile(fileType) {
      this.setIsLoading(true);
      await this.createReportFile({
        file_type: fileType.toLowerCase(),
        report_type: this.currentTab === 0 ? 'royalty' : 'royalty_transactions',
        params: {
          id: this.report.id,
        },
      });
      this.setIsLoading(false);
      this.showExportModal = false;
    },
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame class="report-page-header">
      <template slot="title">
        Royalty report {{ report.id }}
      </template>
      <span slot="description">
        <div class="header-date">
          <span>
            <IconDate/>
          </span>
          <span>
            {{ getFormattedDate(report.period_from.seconds) }}
            —
            {{ getFormattedDate(report.period_to.seconds) }}
          </span>
        </div>
         <UiLabelTag class="status" :color="colors[report.status]">
          {{ getStatus(report.status) }}
        </UiLabelTag>
      </span>
    </UiPageHeaderFrame>
    <div class="report-buttons" v-if="report.status === 'pending'">
      <span v-if="userPermissions.acceptRoyaltyReports">
        <UiButton
          size="default"
          :isTransparent="true"
          @click="confirmReport"
          >
          <IconCheckInCircle slot="iconBefore" />
          Confirm
        </UiButton>
      </span>
      <span v-if="userPermissions.viewDisputs">
        <UiButton
          size="default"
          :color="`transparent-gray`"
          :isTransparent="true"
          @click="openDispute"
          >
          <IconDispute slot="iconBefore" />
          Dispute
        </UiButton>
      </span>
    </div>

    <UiPanel>
      <div class="panel-header">
        <div class="panel-header__col">
          <UiTabs
            class="tabs"
            :items="reportTabs"
            v-model="currentTab">
          </UiTabs>
        </div>
        <div class="panel-header__col">
          <div class="export">
            <div class="export__button" @click="showExportModal = !showExportModal">
                <IconDownload/>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 0 && report.summary !== null">
        <div class="total-summary">
          <div class="total-summary__col">
            <span>
              {{ report.currency }}
            </span>
            <span>Report currency</span>
          </div>
          <div class="total-summary__col">
            <span>
              {{
                 report.summary.products_total !== null
                  ? report.summary.products_total.total_transactions
                  : 0
              }}
            </span>
            <span>Transactions quantity</span>
          </div>
          <div class="total-summary__col">
            <span>
              {{
                report.summary.corrections !== null
                  ? report.summary.corrections.amount
                  : 0
              }}
            </span>
            <span>Correction amount</span>
          </div>
          <div class="total-summary__col">
            <span>
              {{
                report.summary.rolling_reserves !== null
                  ? report.summary.rolling_reserves.amount
                  : 0
              }}
            </span>
            <span>Rolling reserve amount</span>
          </div>
        </div>

        <UiTable class="summary-table" v-if="report.summary.products_items !== null">
          <UiTableRow :isHead="true">
            <UiTableCell align="left">Product</UiTableCell>
            <UiTableCell align="left">Country</UiTableCell>
            <UiTableCell align="left">Total End User Sales</UiTableCell>
            <UiTableCell align="left">Total End User Fees</UiTableCell>
            <UiTableCell align="left">Returns Qty</UiTableCell>
            <UiTableCell align="left">Returns Amount</UiTableCell>
            <UiTableCell align="left">End User Sales</UiTableCell>
            <UiTableCell align="left">End User Fees</UiTableCell>
            <UiTableCell align="left">VAT on End User Sales</UiTableCell>
            <UiTableCell align="left">License Share</UiTableCell>
            <UiTableCell align="left">License Fee</UiTableCell>
          </UiTableRow>
          <UiTableRow
            class="product-total"
            v-if="report.summary !== null && report.summary.products_total !== null"
             >
            <UiTableCell align="left">
              Total
            </UiTableCell>
            <UiTableCell/>
            <UiTableCell align="left">
              {{ report.summary.products_total.total_transactions }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.gross_sales_amount.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.returns_count }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.gross_returns_amount.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.sales_count }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.gross_total_amount.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.total_vat.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.total_fees.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ report.summary.products_total.payout_amount.toFixed(2) }}
            </UiTableCell>
          </UiTableRow>
          <UiTableRow
            class="product"
            v-for="(product, index) in report.summary.products_items"
            :key="index"
            >
            <UiTableCell align="left">
              {{ product.product }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.region }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.total_transactions }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.gross_sales_amount.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.returns_count }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.gross_returns_amount.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.sales_count }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.gross_total_amount.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.total_vat.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.total_fees.toFixed(2) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ product.payout_amount.toFixed(2) }}
            </UiTableCell>
          </UiTableRow>
        </UiTable>
      </div>

      <UiTable v-if="currentTab === 1 && transactionsList.count !== 0">
        <UiTableRow :isHead="true">
          <UiTableCell align="left">Product</UiTableCell>
          <UiTableCell align="left">Transaction ID</UiTableCell>
          <UiTableCell align="left">Date & Time</UiTableCell>
          <UiTableCell align="left">Country</UiTableCell>
          <UiTableCell align="left">Method</UiTableCell>
          <UiTableCell align="left">Amount</UiTableCell>
          <UiTableCell align="left">VAT</UiTableCell>
          <UiTableCell align="left">Comission</UiTableCell>
          <UiTableCell align="left">Payout</UiTableCell>
        </UiTableRow>
        <UiTableRow
          class="transaction"
          v-for="(transaction, index) in transactionsList.items"
          :key="index"
          >
          <UiTableCell align="left">
            <div class="status-dot"
              :class="`status-${transaction.status}-dot`"
              :title="transaction.status">
            </div>
            {{ getProductName(transaction.items) }}
          </UiTableCell>
          <UiTableCell align="left">
            {{ transaction.transaction }}
          </UiTableCell>
          <UiTableCell align="left">
            {{ formatDateAndTime(transaction.created_at.seconds) }}
          </UiTableCell>
          <UiTableCell
            align="left"
            class="country-name"
            :title="getCountryByCode(transaction.country_code)"
            >
            <div>
              {{ getCountryByCode(transaction.country_code) }}
            </div>
          </UiTableCell>
          <UiTableCell align="left">
            {{ transaction.payment_method.title }}
          </UiTableCell>
          <UiTableCell align="left">
            {{
              transaction.status === 'refunded'
              ? $formatPrice(
                transaction.refund_gross_revenue.amount,
                transaction.refund_gross_revenue.currency
              )
              : $formatPrice(
                transaction.gross_revenue.amount,
                transaction.gross_revenue.currency
              )
            }}
          </UiTableCell>
          <UiTableCell align="left">
            {{
              transaction.status === 'refunded'
              ? $formatPrice(
                transaction.refund_tax_fee.amount,
                transaction.refund_tax_fee.currency
              )
              : $formatPrice(
                transaction.tax_fee.amount,
                transaction.tax_fee.currency
              )
            }}
          </UiTableCell>
          <UiTableCell align="left">
            {{
              transaction.status === 'refunded'
              ? $formatPrice(
                transaction.refund_fees_total.amount ? transaction.refund_fees_total.amount : 0,
                transaction.refund_fees_total.currency
              )
              : $formatPrice(
                transaction.fees_total.amount,
                transaction.fees_total.currency
              )
            }}
          </UiTableCell>
          <UiTableCell class="transaction-amount" align="left"
            :class="`status-${transaction.status}`">
            {{
              transaction.status === 'refunded'
              ? $formatPrice(
                transaction.refund_reverse_revenue.amount,
                transaction.refund_reverse_revenue.currency
              )
              : $formatPrice(
                transaction.net_revenue.amount,
                transaction.net_revenue.currency
              )
            }}
          </UiTableCell>
        </UiTableRow>
      </UiTable>
    </UiPanel>

    <ReportDispute
      v-show="showDisputeModal"
      @close="showDisputeModal = false"
      @input="declineReport($event)"
    />

    <ExportModal
      title="Export of royalty report"
      v-show="showExportModal"
      @export="exportFile"
      @close="showExportModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.report-page-header {
  position: relative;
}

.status {
  text-transform: capitalize;
}

.header-date {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  margin-bottom: 10px;
  & span {
    margin-right: 10px;

    & svg {
      position: relative;
      top: 2px;
    }
  }
}

.report-buttons {
  width: 100%;
  margin: 20px 0;

  display: flex;
  align-items: center;

  & span {
    width: 50%;
    &:first-child {
      margin-right: 8px;
      & button svg {
        fill: #3d7bf5;
      }
    }
    & button {
      width: 100%;
    }
  }
}

.transaction-amount {
  color: aqua;
}

.tabs {
  margin: 0 0 24px;
  position: relative;
}

.total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;

  background-color: #f7f9fa;
  margin: 0 0 24px;
  &__col {
    text-align: center;
    margin: 12px 24px;
    & span {
      font-size: 12px;
      display: block;
      &:first-child {
        font-size: 16px;
        font-weight: 500;
        color: #000;
      }
    }
  }
}

.summary-table {
  font-size: 12px;
  .product:nth-child(2n + 1) {
    background-color: #f7f9fa;
  }
  .ui-table-cell {
    padding-right: 8px;
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-sizing: border-box;
  display: inline-block;
  position: relative;
  top: -2px;
  margin-right: 5px;

  &.green {
    background: #2fa84f;
  }

  &.blue {
    background: #3d7bf5;
  }

  &.yellow {
    background: #f3aa18;
  }

  &.red {
    background: #ea3d2f;
  }

  &.transparent {
    border: 1px solid #919699;
  }
}

.status-processed {
  color: #069697;
  &-dot {
    background: #069697;
  }
}

.status-refunded {
  color: #ea3d2f;
  &-dot {
    background: #ea3d2f;
  }
}

.product-total {
  font-weight: 500;
}

.export {
  position: relative;
  top: -10px;
  &__button {
    width: 40px;
    height: 40px;
    margin: 0 auto;

    border: 1px solid #e3e5e6;
    box-sizing: border-box;
    border-radius: 4px;

    display: flex;
    justify-content: center;
    align-items: center;

    cursor: pointer;
    transition: all 0.2s ease-out;
    & > svg {
      fill: #78909c;
      transition: fill 0.2s ease-out;
    }

    &:hover {
      background: rgba(61, 123, 245, 0.08);

      & > svg {
        fill: #3d7bf5;
      }
    }
  }
}
.panel-header {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;
  &__col {
    width: 6%;
    &:first-child {
      width: 94%;
    }
  }
}
</style>
