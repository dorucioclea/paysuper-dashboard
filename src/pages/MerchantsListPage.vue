<script>
import { debounce, get } from 'lodash-es';
import { mapState, mapGetters, mapActions } from 'vuex';
import Notifications from '@/mixins/Notifications';
import MerchanstListStore from '@/store/MerchanstListStore';
import SimplePageHeader from '@/components/SimplePageHeader.vue';
import NoResults from '@/components/NoResults.vue';
import PictureDiagramPresentation from '@/components/PictureDiagramPresentation.vue';
import FilterSearchInput from '@/components/FilterSearchInput.vue';
import FilterDate from '@/components/FilterDate.vue';

export default {
  mixins: [Notifications],

  components: {
    SimplePageHeader,
    PictureDiagramPresentation,
    NoResults,
    FilterSearchInput,
    FilterDate,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('MerchanstList', MerchanstListStore, {
        query: route.query,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      filters: {},
      isSearchRouting: false,
      isInfiniteScrollLocked: false,
    };
  },

  async beforeRouteUpdate(to, from, next) {
    if (!this.isSearchRouting) {
      this.initQuery(to.query);
      this.updateFiltersFromQuery();
      this.setIsLoading(true);
      await this.fetchMerchants().catch(this.$_Notifications_showErrorMessage);
      this.setIsLoading(false);
    }
    this.isSearchRouting = false;
    next();
  },

  created() {
    this.updateFiltersFromQuery();
  },

  mounted() {
    this.initInfiniteScroll();
  },

  computed: {
    ...mapState('MerchanstList', ['merchants', 'filterValues', 'query', 'apiQuery']),
    ...mapGetters('MerchanstList', ['getFilterValues']),

    handleQuickSearchInput() {
      return debounce(() => {
        this.filterMerchants();
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

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('MerchanstList', [
      'submitFilters', 'fetchMerchants', 'initQuery', 'sendNotification',
    ]),

    get,

    updateFiltersFromQuery() {
      this.filters = this.getFilterValues(['quickFilter', 'offset', 'limit', 'dateFrom', 'dateTo']);
    },

    filterMerchants() {
      this.filters.offset = 0;
      this.searchMerchants();
    },

    initInfiniteScroll() {
      this.$appEventsOn('contentScrollReachEnd', async () => {
        if (
          this.isInfiniteScrollLocked
          || this.filters.offset + this.filters.limit > this.merchants.count
        ) {
          return;
        }
        this.isInfiniteScrollLocked = true;

        this.filters.offset += this.filters.limit;
        await this.searchMerchants();
        this.isInfiniteScrollLocked = false;
      });
    },

    async searchMerchants() {
      this.isSearchRouting = true;
      this.setIsLoading(true);
      this.submitFilters(this.filters);
      this.navigate();
      await this.fetchMerchants().catch(this.$_Notifications_showErrorMessage);
      this.setIsLoading(false);
    },

    navigate() {
      this.$router.push({
        path: this.$route.path,
        query: this.query,
      });
    },

    async handleSendNotification(merchant, notification) {
      this.setIsLoading(true);
      try {
        await this.sendNotification({
          notification,
          merchantId: merchant.id,
        });
        this.$_Notifications_showSuccessMessage('Notification sent successfully');
      } catch (error) {
        console.warn(error);
        this.$_Notifications_showErrorMessage('Failed to send notification');
      }
      this.setIsLoading(false);
    },

    getCountry(merchant) {
      const country = get(merchant, 'company.country');
      if (!country) {
        return '—';
      }
      return this.$t(`countries.${country}`);
    },

    getLastPayoutValue(merchant) {
      const amount = get(merchant, 'last_payout.amount');
      if (!amount) {
        return '—';
      }

      const currency = get(merchant, 'banking.currency', '');
      return this.$formatPrice(amount, currency);
    },
  },
};
</script>

<template>
<div>
  <SimplePageHeader>
    <span slot="title">Merchants</span>
    <span slot="description">
      Here is the list of our active merchants with license agreement signed by both sides.
      These clients have full access to Pay Super platform functionality.
    </span>
    <PictureDiagramPresentation slot="picture" />
  </SimplePageHeader>

  <UiPanel>

    <div class="filters">
      <FilterSearchInput
        :isAlwaysExpanded="true"
        v-model="filters.quickFilter"
        @input="handleQuickSearchInput"
      />
      <FilterDate
        v-model="dateFilter"
        @input="filterMerchants"
      />
    </div>

    <UiTable
      v-if="merchants.items.length"
      layout="fixed"
    >
      <UiTableRow :isHead="true">
        <UiTableCell width="16.666%" align="left">Company</UiTableCell>
        <UiTableCell width="16.666%" align="left">Owner name</UiTableCell>
        <UiTableCell width="16.666%" align="left">Country</UiTableCell>
        <UiTableCell width="16.666%" align="left">Registration date</UiTableCell>
        <UiTableCell width="16.666%" align="left">Last payout date</UiTableCell>
        <UiTableCell width="16.666%" align="left">Last payout sum</UiTableCell>
      </UiTableRow>
      <UiTableRow
        class="content-row"
        v-for="merchant in merchants.items"
        :key="merchant.id"
        :link="`/merchants/${merchant.id}`"
      >
        <UiTableCell align="left">
          <span
            class="cell-text"
            :class="{'_empty': !get(merchant, 'company.name')}"
          >
            {{get(merchant, 'company.name', '—')}}
          </span>
        </UiTableCell>
        <UiTableCell align="left">
          <span
            class="cell-text"
            :class="{'_empty': !get(merchant, 'user.email')}"
          >
            {{get(merchant, 'user.email', '—')}}
          </span>
        </UiTableCell>
        <UiTableCell align="left">
          <span
            class="cell-text"
            :class="{'_empty': !get(merchant, 'company.country')}"
          >
            {{getCountry(merchant)}}
          </span>
        </UiTableCell>
        <UiTableCell align="left">
          <span
            class="cell-text"
            :class="{'_empty': !merchant.created_at}"
          >
            {{$formatDate(merchant.created_at, 'DD.MM.YY') || '—'}}
          </span>
          <span class="cell-text"></span>
        </UiTableCell>
        <UiTableCell align="left">
          <span
            class="cell-text"
            :class="{'_empty': !get(merchant, 'last_payout.date')}"
          >
            {{$formatDate(get(merchant, 'last_payout.date'), 'DD.MM.YY') || '—'}}
          </span>
        </UiTableCell>
        <UiTableCell align="left">
          <span
            class="cell-text _price"
            :class="{'_empty': !get(merchant, 'last_payout.amount')}"
          >
            {{getLastPayoutValue(merchant)}}
          </span>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
    <NoResults v-else />
  </UiPanel>
</div>
</template>

<style lang="scss" scoped>
.cell-text {
  &:not(._price) {
    max-width: 100%;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &._price {
    color: #069697;
    font-weight: 500;
  }

  &._empty {
    color: #c6cacc;
  }

  .content-row:hover & {
    color: #3d7bf5;
  }
}

.filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
}
</style>