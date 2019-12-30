<script>
import {
  mapState, mapGetters, mapActions,
} from 'vuex';
import { format } from 'date-fns';
import {
  isEqual, get, find, remove,
} from 'lodash-es';
import transactionsListCompositeFilterScheme from '@/schemes/transactionsListCompositeFilterScheme';
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
      scheme: transactionsListCompositeFilterScheme,
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
        'hideTest',
      ]);
    },

    async filterTransactions() {
      this.filters.offset = 0;
      await this.searchItems();
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

    handleStatusChange({ filter, value }) {
      if (filter === 'clear') {
        this.filters.status = [];
        this.filters.dateFrom = null;
        this.filters.dateTo = null;
        this.filters.hideTest = '';
      } else if (filter === 'status') {
        if (value === 'all') {
          this.filters.status = [];
        } else if (this.filters[filter].includes(value)) {
          remove(this.filters[filter], n => n === (value));
        } else {
          this.filters[filter].push(value);
        }
      } else if (filter === 'hideTest') {
        this.filters.hideTest = this.filters.hideTest ? '' : 'true';
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
      try {
        await this.refund({ transaction: this.currentTransaction, reason });
        this.$showSuccessMessage('Refund created');
      } catch (error) {
        this.$showErrorMessage(error);
      }
<<<<<<< HEAD
      this.setIsLoading(false);
=======
      this.filterTransactions();
>>>>>>> 193525 test mark for transactions + new UiCompositeFilter
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
          <UiCompositeFilter
            class="status-filter"
            :filters="filters"
            :scheme="scheme"
            :countsByFilter="filterCounts"
            @change="handleStatusChange"
          />
        </div>

        <div class="control-bar__right">
          <div class="export-button"
            v-if="transactionsList.items.length"
            @click="showExportModal = !showExportModal"
          >
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
            v-for="transaction in transactionsList.items"
            :class="{ '_test': !transaction.is_production }"
            :key="transaction.uuid"
            :link="`/transactions/${transaction.uuid}`"
          >
            <UiTableCell align="left" class="status">
              <div
                :class="['status-dot', getColor(transaction.status)]"
                :title="transaction.status"
              ></div>
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
            <UiTableCell align="left">
              <div class="transaction__id">
                <span class="transaction__id-test" v-if="!transaction.is_production">TEST</span>
                {{ transaction.transaction || '—'}}
              </div>
            </UiTableCell>
            <UiTableCell align="left" :class="`status-${transaction.status}`">
              {{ $formatPrice(transaction.order_charge.amount, transaction.order_charge.currency) }}
            </UiTableCell>
            <UiTableCell align="left" v-if="userPermissions.cancelTransactions">
              <div
                v-if="transaction.refund_allowed"
                class="transaction__refund"
                @click.stop.prevent="showRefundModal = true, currentTransaction = transaction"
              >
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
      @input="handleRefund($event)"
    ></TransactionRefund>

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

.transaction {
  &._test {
    background: #f7f9fa;
  }
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

  &__id {
    position: relative;

    &-test {
      position: absolute;
      font-weight: 500;
      font-size: 8px;
      line-height: 14px;
      letter-spacing: 0.1em;
      top: -9px;

      .transaction._test:not(:hover) & {
        color: #919699;
      }
    }
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
