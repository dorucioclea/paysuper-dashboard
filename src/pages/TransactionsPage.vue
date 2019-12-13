<script>
import {
  mapState, mapGetters, mapActions,
} from 'vuex';
import { format } from 'date-fns';
import {
  debounce, isEqual, get, find, remove,
} from 'lodash-es';
import transactionsStatusScheme from '@/schemes/transactionsStatusScheme';
import PictureTabletWithChart from '@/components/PictureTabletWithChart.vue';
import TransactionsListStore from '@/store/TransactionsListStore';
import NoResults from '@/components/NoResults.vue';
import TransactionRefund from '@/components/TransactionRefund.vue';
import ExportModal from '@/components/ExportModal.vue';

const STATUS_COLOR = {
  created: 'blue',
  processed: 'green',
  pending: 'yellow',
  refunded: 'red',
  chargeback: 'red',
  rejected: 'transparent',
  canceled: 'transparent',
};

export default {
  name: 'TransactionsPage',

  components: {
    PictureTabletWithChart,
    NoResults,
    TransactionRefund,
    ExportModal,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('Transactions', TransactionsListStore, {
        query: route.query,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      filters: {},
      scheme: transactionsStatusScheme,
      filterCounts: {},
      showRefundModal: false,
      currentTransaction: null,
      showExportModal: false,
    };
  },

  computed: {
    ...mapState('Transactions', ['transactionsList', 'filterValues', 'query', 'apiQuery']),
    ...mapGetters('Transactions', ['getFilterValues']),
    ...mapGetters('Dictionaries', ['countries']),
    ...mapGetters('User', ['userPermissions']),

    handleQuickSearchInput() {
      return debounce(() => {
        this.filterTransactions();
      }, 500);
    },

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
  },

  watch: {
    filters: {
      handler() {
        this.fillCounts();
      },
      deep: true,
    },
  },

  created() {
    this.updateFiltersFromQuery();
  },

  mounted() {
    this.initInfiniteScroll();
    this.fillCounts();
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('ExportFile', ['createReportFile']),
    ...mapActions('Transactions', [
      'initQuery',
      'createItem',
      'submitFilters',
      'fetchTransactions',
      'refund',
    ]),

    get,

    updateFiltersFromQuery() {
      this.filters = this.getFilterValues([
        'quickFilter',
        'offset',
        'limit',
        'status',
        'dateFrom',
        'dateTo',
      ]);
    },

    filterTransactions() {
      this.filters.offset = 0;
      this.searchItems();
    },

    async searchItems() {
      this.isSearchRouting = true;
      this.setIsLoading(true);
      this.submitFilters(this.filters);
      this.navigate();
      await this.fetchTransactions().catch(this.$showErrorMessage);
      this.setIsLoading(false);
    },

    initInfiniteScroll() {
      this.$appEventsOn('contentScrollReachEnd', async () => {
        if (
          this.isInfiniteScrollLocked
          || this.filters.offset + this.filters.limit >= this.transactionsList.count
        ) {
          return;
        }
        this.isInfiniteScrollLocked = true;

        this.filters.offset += this.filters.limit;
        await this.searchItems();
        this.isInfiniteScrollLocked = false;
      });
    },

    navigate() {
      if (isEqual(this.$route.query, this.query)) {
        return;
      }
      this.$router.push({
        path: this.$route.path,
        query: this.query,
      });
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

    formatDateAndTime(seconds) {
      const datetime = new Date(seconds * 1000);
      return format(datetime, 'dd.MM.yyyy, HH:mm:ss');
    },

    getColor(status) {
      return STATUS_COLOR[status];
    },

    refundAvailable(status) {
      const badStatus = [
        'canceled',
        'refunded',
        'rejected',
        'chargeback',
      ];
      return !badStatus.includes(status);
    },

    handleStatusInput(data) {
      if (data === 'all') {
        this.filters.status = [];
        this.filters.dateFrom = null;
        this.filters.dateTo = null;
        this.filterTransactions();
      }
    },

    handleFilterInput(data) {
      if (data.value === 'all') {
        this.filters[data.filter] = [];
      } else if (this.filters[data.filter].includes(data.value)) {
        remove(this.filters[data.filter], n => n === (data.value));
      } else {
        this.filters[data.filter].push(data.value);
      }

      this.fillCounts();
      this.filterTransactions();
    },

    fillCounts() {
      this.filterCounts = {
        status: get(this.filters, 'status.length') || 0,
        methods: get(this.filters, 'methods.length') || 0,
      };
    },

    async handleRefund(reason) {
      this.setIsLoading(true);
      await this.refund({ transaction: this.currentTransaction, reason })
        .then(() => {
          this.$showSuccessMessage('Refund created');
        })
        .catch(this.$showErrorMessage);
      this.filterTransactions();
      this.setIsLoading(false);
      this.showRefundModal = false;
    },

    async exportFile(fileType) {
      this.setIsLoading(true);
      await this.createReportFile({
        file_type: fileType.toLowerCase(),
        report_type: 'transactions',
        params: {
          pm_date_from: this.filters.dateFrom || 0,
          pm_date_to: this.filters.dateTo || 0,
          status: this.filters.status,
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
    <UiPageHeaderFrame>
      <template slot="title">
        Transactions
      </template>
      <span slot="description">
        All your customers' transactions are presented here, organised by Products,
        Dates and other parameters.
        Click any transaction to dive into transaction card to see additional details.
      </span>
      <PictureTabletWithChart slot="picture" />
    </UiPageHeaderFrame>

    <UiPanel>
      <div class="control-bar">
        <div class="control-bar__left">
          <UiFilterDate
            v-model="dateFilter"
            @input="filterTransactions"
          />
          <UiStatusFilter
            @input="handleStatusInput"
            @inputSecondLevel="handleFilterInput"
            :value="filters"
            :scheme="scheme"
            :countsByStatus="filterCounts" />
        </div>

        <div class="control-bar__right">
          <div class="export-button"
            @click="showExportModal = !showExportModal"
            v-if="transactionsList.items.length">
            <IconDownload/>
          </div>
        </div>
      </div>

      <div class="transactions-list">
        <UiTable v-if="transactionsList.items.length">
          <UiTableRow :isHead="true">
            <UiTableCell align="left">Project</UiTableCell>
            <UiTableCell align="left">Product</UiTableCell>
            <UiTableCell align="left">Date & Time</UiTableCell>
            <UiTableCell align="left">Country</UiTableCell>
            <UiTableCell align="left">Method</UiTableCell>
            <UiTableCell align="left">Transaction ID</UiTableCell>
            <UiTableCell align="left">Amount</UiTableCell>
            <UiTableCell align="left" width="3%" v-if="userPermissions.cancelTransactions" />
          </UiTableRow>
          <UiTableRow
            class="transaction"
            v-for="(transaction, index) in transactionsList.items"
            :key="index"
            :link="`/transactions/${transaction.uuid}`">
            <UiTableCell align="left" class="status">
              <div class="status-dot"
                   :class="getColor(transaction.status)"
                   :title="transaction.status"></div>
              {{ transaction.project.name.en }}
            </UiTableCell>
            <UiTableCell align="left">{{ getProductName(transaction.items) }}</UiTableCell>
            <UiTableCell align="left">
              {{ formatDateAndTime(transaction.created_at.seconds) }}
            </UiTableCell>
            <UiTableCell
              align="left"
              class="country-name"
              :title="getCountryByCode(transaction.country_code)">
              <div>{{ getCountryByCode(transaction.country_code) }}</div>
            </UiTableCell>
            <UiTableCell align="left">{{ transaction.payment_method.title }}</UiTableCell>
            <UiTableCell align="left">{{ transaction.transaction }}</UiTableCell>
            <UiTableCell align="left" :class="`status-${transaction.status}`">
              {{$formatPrice(transaction.total_payment_amount, transaction.currency)}}
            </UiTableCell>
            <UiTableCell align="left" v-if="userPermissions.cancelTransactions">
              <div class="transaction__refund"
                   v-if="refundAvailable(transaction.status)"
                   @click.stop.prevent="showRefundModal = true, currentTransaction = transaction">
                <IconRetry/>
                <UiTip
                  width="140px"
                  :visible="true"
                  position="top"
                  innerPosition="center"
                  :margin="10"
                  class="transaction__refund-tip">
                  Request for refund
                </UiTip>
              </div>

            </UiTableCell>
          </UiTableRow>
        </UiTable>

        <NoResults type="add-new" v-else>You don’t have any transactions yet</NoResults>
      </div>
    </UiPanel>

    <TransactionRefund
      :showModal="showRefundModal"
      @close="showRefundModal = false"
      @input="handleRefund($event)"></TransactionRefund>

    <ExportModal
      title="Export list of transactions per period"
      v-show="showExportModal"
      @export="exportFile"
      @close="showExportModal = false"
      />
  </div>
</template>

<style lang="scss" scoped>
.control-bar {
  display: flex;
  justify-content: space-between;
}

.status-filter {
  margin-left: 4px;
  position: relative;
  top: 1px;
}

.transactions-list {
  margin-top: 32px;
}

.country-name > div {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100px;
}

.transaction {
  &:hover {
    background: rgba(61, 123, 245, 0.08);
    color: #3d7bf5;
    cursor: pointer;
  }

  &__refund {
    position: relative;
    &-tip {
      display: none;
      height: 39px;
      background: #000;
      border-radius: 4px;
      color: #fff;
      font-size: 12px;
      text-align: center;
      line-height: 38px;
      box-shadow: none;

      &:after {
        display: block;
        content: "";
        width: 6px;
        height: 6px;
        position: absolute;
        bottom: -4px;
        background: #000000;
        transform: rotate(45deg);
      }
    }

    &:hover &-tip {
      display: block;
    }
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
}

.status-refunded {
  color: #ea3d2f;
}

.export-button {
  width: 40px;
  height: 40px;
  display: flex;
  border: 1px solid #e3e5e6;
  box-sizing: border-box;
  border-radius: 4px;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
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
</style>
