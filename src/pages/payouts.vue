<script>
import {
  mapState, mapGetters, mapActions,
} from 'vuex';
import {
  isEqual, startCase, capitalize, forEach,
} from 'lodash-es';
import { format } from 'date-fns';
import PayoutsStore from '@/store/PayoutStore';
import NoResults from '@/components/NoResults.vue';
import payoutsStatusScheme from '@/schemes/payoutsStatusScheme';
import ExportModal from '@/components/ExportModal.vue';
import PictureExcellentWork from '@/components/PictureExcellentWork.vue';
import PictureGrave from '@/components/PictureGrave.vue';

export default {
  name: 'payouts',

  components: {
    ExportModal,
    NoResults,
    PictureExcellentWork,
    PictureGrave,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('Payouts', PayoutsStore, {
        query: route.query,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      filters: {},
      scheme: payoutsStatusScheme,
      filterCounts: {},
      showRefundModal: false,
      colors: {},
      showModal: false, // export modal (not currently in use. the export works only in pdf)
      successModal: false, // create payout complete
      failModal: false,
      currentDoc: null,
    };
  },

  computed: {
    ...mapState('Payouts', ['payoutsList', 'filterValues', 'query', 'apiQuery', 'balance']),
    ...mapState('User/Merchant', ['merchant']),
    ...mapGetters('Payouts', ['getFilterValues']),
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

    // show 'create payout' button if true
    manualPayout() {
      return this.merchant.manual_payouts_enabled;
    },

    payoutAvailable() {
      return this.balance.total > this.merchant.min_payout_amount;
    },
  },

  created() {
    this.updateFiltersFromQuery();
    forEach(payoutsStatusScheme, (i) => {
      if (i.value !== 'all') {
        this.colors[i.value] = i.color;
      }
    });
  },

  mounted() {
    this.initInfiniteScroll();
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('ExportFile', ['createReportFile', 'initWaitingFile']),
    ...mapActions('Payouts', [
      'initQuery',
      'submitFilters',
      'fetchPayouts',
      'createPayout',
    ]),

    format,

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

    filterPayouts() {
      this.filters.offset = 0;
      this.searchItems();
    },

    async searchItems() {
      this.isSearchRouting = true;
      this.setIsLoading(true);
      this.submitFilters(this.filters);
      this.navigate();
      await this.fetchPayouts().catch(this.$showErrorMessage);
      this.setIsLoading(false);
    },

    initInfiniteScroll() {
      this.$appEventsOn('contentScrollReachEnd', async () => {
        if (
          this.isInfiniteScrollLocked
          || this.filters.offset + this.filters.limit >= this.payoutsList.count
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

    formatPeriod(fromSec, toSec) {
      const dateFrom = new Date(fromSec * 1000);
      const dateTo = new Date(toSec * 1000);
      return `${format(dateFrom, 'dd.MM.yyyy')} — ${format(dateTo, 'dd.MM.yyyy')}`;
    },

    handleStatusInput(value) {
      if (value === 'all') {
        this.filters.status = [];
        this.filters.dateFrom = null;
        this.filters.dateTo = null;
      } else {
        this.filters.status.push(value);
      }
      this.filterPayouts();
    },

    getStatusName(status) {
      return capitalize(startCase(status));
    },

    newPayout() {
      const description = 'manual payout';
      this.setIsLoading(true);
      this.createPayout(description)
        .then(() => {
          this.successModal = true;
          this.filterPayouts();
        })
        .catch(this.$showErrorMessage)
        .finally(() => this.setIsLoading(false));
    },

    async exportFile(fileType, id) {
      this.setIsLoading(true);
      await this.createReportFile({
        file_type: fileType.toLowerCase(),
        report_type: 'payout',
        params: {
          id,
        },
      });
      this.setIsLoading(false);
      this.showModal = false;
    },
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame>
      <template slot="title">
        Payouts
      </template>
      <span slot="description">
        Each payout is based on one or more royalty reports.
        On a quarterly basis you will get an automatically formed payout invoice to close
        a quarter taxation period.

        <template v-if="userPermissions.createPayouts">
          <div class="create-button" v-if="manualPayout">
            <UiButton @click="newPayout" color="blue" :disabled="!payoutAvailable">
              CREATE PAYOUT
            </UiButton>
          </div>
          <div class="autopayouts" v-else>
            <div class="autopayouts__ico">
              <IconHistory />
            </div>
            <div class="autopayouts__info">
              <UiHeader level="4">Autopayouts enabled</UiHeader>
              <!--<p>If you want to change it pls go to
                <router-link to="/">payout settings</router-link>
              </p>-->
            </div>
          </div>
        </template>
      </span>
    </UiPageHeaderFrame>

    <UiPanel class="balance">
      <div class="balance__total">
        {{ $formatPrice(balance.total, balance.currency) }}
      </div>
      <div class="balance__description">Amount available for withdrawal</div>
    </UiPanel>

    <UiPanel>
      <div class="control-bar">
        <div class="control-bar__left">
          <UiFilterDate
            v-model="dateFilter"
            @input="filterPayouts"
          />
          <UiStatusFilter
            @input="handleStatusInput"
            align="left"
            :value="filters.status"
            :scheme="scheme"/>
        </div>

        <div class="control-bar__right"></div>
      </div>

      <div class="payouts-list">
        <UiTable v-if="payoutsList.items.length">
          <UiTableRow :isHead="true">
            <UiTableCell align="left">Period</UiTableCell>
            <UiTableCell align="left">Report date</UiTableCell>
            <UiTableCell align="left">Payout ID</UiTableCell>
            <UiTableCell align="left">Payment date</UiTableCell>
            <UiTableCell align="left">Amount</UiTableCell>
            <UiTableCell align="left">Status</UiTableCell>
            <UiTableCell align="left" width="3%"></UiTableCell>
          </UiTableRow>
          <UiTableRow
            v-for="(payout, index) in payoutsList.items"
            :key="index"
            :link="`/payouts/${payout.id}`">
            <UiTableCell align="left">
              {{ formatPeriod(payout.period_from.seconds, payout.period_to.seconds) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ format(payout.created_at.seconds * 1000, 'dd.MM.yyyy') }}
            </UiTableCell>
            <UiTableCell align="left">{{ payout.id }}</UiTableCell>
            <UiTableCell align="left">
              <template v-if="payout.paid_at">
                {{ format(payout.paid_at.seconds * 1000, 'dd.MM.yyyy') }}
              </template>
              <template v-else>&mdash;</template>
            </UiTableCell>
            <UiTableCell align="left">
              {{ $formatPrice(payout.balance, payout.currency) }}
            </UiTableCell>
            <UiTableCell align="left">
              <UiLabelTag :color="colors[payout.status]" class="status-label">
                {{ getStatusName(payout.status) }}
                <div class="skip-tip" v-if="payout.status === 'skip'">
                  <span class="icon"><IconInfo/></span>
                  <UiTip
                    width="258px"
                    :visible="true"
                    position="top"
                    innerPosition="center"
                    :margin="10"
                    class="skip-tip__tip">
                    You could not exceed your minimum payout threshold limit for now.
                  </UiTip>
                </div>
              </UiLabelTag>
            </UiTableCell>
            <UiTableCell align="left" width="3%">
              <div class="download" @click.stop.prevent="exportFile('pdf', payout.id)">
                <IconDownload></IconDownload>
              </div>
            </UiTableCell>
          </UiTableRow>
        </UiTable>

        <NoResults type="add-new" v-else>You don’t have any item yet</NoResults>
      </div>
    </UiPanel>

    <ExportModal
      title="Export of payout"
      v-show="showModal"
      @export="exportFile"
      @close="showModal = false"
    />

    <UiModal class="success-payout" width="448px" v-show="successModal">
      <div class="success-payout__content">
        <PictureExcellentWork></PictureExcellentWork>
        <UiHeader level="3" align="center" class="success-payout__header">
          Payout successfully created
        </UiHeader>
        <p class="success-payout__text">
          Your total royalty amount is waiting to be Paid.
          Since payment procedure will take some time you will get a notification.
        </p>
        <div class="success-payout__controls">
          <UiButton color="blue" @click="successModal = false">DONE</UiButton>
        </div>
      </div>
    </UiModal>

    <UiModal class="fail-payout" width="448px" v-show="failModal">
      <div class="fail-payout__content">
        <PictureGrave></PictureGrave>
        <UiHeader level="3" align="center" class="fail-payout__header">
          Something went wrong
        </UiHeader>
        <p class="fail-payout__text">
          You have at least one unconfirmed royalty report.
          Please Confirm it before creating payout.
        </p>
        <div class="fail-payout__controls">
          <UiButton :isTransparent="true" color="gray" @click="failModal = false">CLOSE</UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<style lang="scss" scoped>
.balance {
  margin-bottom: 8px;
  text-align: center;

  &__total {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 0.15px;
    color: #000;
  }

  &__description {
    font-size: 12px;
    color: #5e6366;
  }
}

.create-button {
  margin-top: 20px;
}

.status-filter {
  margin-left: 4px;
  position: relative;
  top: 1px;
}

.payouts-list {
  margin-top: 32px;
}

.download {
  width: 14px;
  height: 14px;
  cursor: pointer;

  svg {
    max-width: 100%;
    max-height: 100%;
    fill: #919699;
  }

  &:hover svg {
    fill: #3d7bf5;
  }
}

.success-payout,
.fail-payout {
  &__content {
    text-align: center;
  }

  &__header {
    margin: 24px 0 8px;
  }

  &__text {
    font-size: 14px;
    color: #5e6366;
  }

  &__controls {
    margin-top: 24px;
  }
}

.status-label {
  position: relative;
  width: 104px;
}

.skip-tip {
  position: absolute;
  left: 8px;
  top: 6px;

  svg {
    width: 12px;
    height: 12px;
    fill: #53585b;
  }

  &__tip {
    display: none;
    align-items: center;
    height: 56px;
    background: #000;
    border-radius: 4px;
    color: #fff;
    font-size: 12px;
    text-align: center;
    line-height: 1.8;
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

  &:hover &__tip {
    display: flex;
  }
}

.autopayouts {
  display: flex;
  margin: 15px 0;
  align-items: center;

  &__ico {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
