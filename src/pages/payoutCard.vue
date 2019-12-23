<script>
import { mapActions, mapState } from 'vuex';
import { format } from 'date-fns';
import { forEach, get } from 'lodash-es';
import ExportModal from '@/components/ExportModal.vue';
import PayoutCardStore from '@/store/PayoutCardStore';
import payoutsStatusScheme from '@/schemes/payoutsStatusScheme';

export default {
  name: 'payoutCard',

  components: {
    ExportModal,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('PayoutCard', PayoutCardStore, {
        payoutId: route.params.id,
      }).catch(this.$showErrorMessage);
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      colors: {},
      tabs: [
        { label: 'Summary', value: 0 },
        { label: 'Royalty reports', value: 1 },
      ],
      currentTab: 0,
      showModal: false,
    };
  },

  computed: {
    ...mapState('PayoutCard', ['payout', 'reports']),
  },

  created() {
    forEach(payoutsStatusScheme, (i) => {
      if (i.value !== 'all') {
        this.colors[i.value] = i.color;
      }
    });
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('ExportFile', ['createReportFile', 'initWaitingFile']),

    format,
    get,

    formatPeriod(fromSec, toSec) {
      const dateFrom = new Date(fromSec * 1000);
      const dateTo = new Date(toSec * 1000);
      return `${format(dateFrom, 'dd.MM.yyyy')} — ${format(dateTo, 'dd.MM.yyyy')}`;
    },

    async exportFile(fileType) {
      this.setIsLoading(true);
      await this.createReportFile({
        file_type: fileType.toLowerCase(),
        report_type: 'payout',
        params: {
          id: this.$route.params.id,
        },
      });
      this.setIsLoading(false);
      this.showModal = false;
    },

    getFormattedDate(item) {
      return item > 0 ? format(item * 1000, 'dd MMM yyyy') : '—';
    },

    getValue(item, path) {
      return get(item, path) || '—';
    },
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame>
      <template slot="title">
        Payout {{ payout.id }}
      </template>
      <span slot="description">
        <div class="period">
          <div class="period-calendar"><IconCalendar/></div>
          {{ formatPeriod(payout.period_from.seconds, payout.period_to.seconds) }}
        </div>
        <UiLabelTag :color="colors[payout.status]">{{payout.status}}</UiLabelTag>
      </span>
    </UiPageHeaderFrame>

    <UiPanel class="payout-panel">
      <UiTabs
        class="tabs"
        :items="tabs"
        v-model="currentTab"
      />

      <div class="export-payout">
        <div class="export-button" @click="exportFile('pdf')">
          <svg width="14" height="17" viewBox="0 0 14 17">
            <path
              d="M0.700195 16.1H13.3002V14.3H0.700195V16.1ZM13.3002
      6.19999H9.7002V0.799988H4.3002V6.19999H0.700195L7.0002 12.5L13.3002 6.19999Z"
            />
          </svg>
        </div>
      </div>

      <div v-if="currentTab === 0" class="details">
        <UiHeader level="3" class="details__header">Payment details</UiHeader>
        <div class="details__container">
          <div class="details__item">
            <div class="details__item--label">Payout ID</div>
            <div class="details__item--info">
              {{ payout.id }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Amount</div>
            <div class="details__item--info">
              {{ $formatPrice(payout.balance, payout.currency) }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Transaction ID</div>
            <div class="details__item--info">
              {{ payout.transaction }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Source</div>
            <div class="details__item--info">

            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Currency</div>
            <div class="details__item--info">
              {{ payout.currency }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Desciption</div>
            <div class="details__item--info">
              {{ payout.description }}
            </div>
          </div>
          <div class="details__item">
            <div class="details-info">
              <span class="icon"><IconQuestion/></span>
              <UiTip
                width="208px"
                :visible="true"
                position="top"
                innerPosition="center"
                :margin="10"
                class="details-info__tip">
                Forecast date for arriving funds to your bank account.
              </UiTip>
            </div>
            <div class="details__item--label">Arrival date</div>
            <div class="details__item--info">
              {{ format(payout.arrival_date.seconds * 1000, 'dd.MM.yyyy') }}
            </div>
          </div>
        </div>
        <div class="details__container bordered">
          <UiHeader level="3" class="details__header">Destination</UiHeader>
          <div class="details__item">
            <div class="details__item--label">SWIFT</div>
            <div class="details__item--info">
              {{ payout.destination.swift }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Beneficiary’s bank name</div>
            <div class="details__item--info">
              {{ payout.destination.name }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Account currency</div>
            <div class="details__item--info">
              {{ payout.destination.currency }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Beneficiary’s bank address</div>
            <div class="details__item--info">
              {{ payout.destination.address }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Beneficiary’s bank account</div>
            <div class="details__item--info">
              {{ payout.destination.account_number }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Correspondent bank account</div>
            <div class="details__item--info">
              {{ payout.destination.correspondent_account }}
            </div>
          </div>
        </div>
        <div class="details__container bordered" v-if="payout.status === 'failed'">
          <UiHeader level="3" class="details__header">Failed details</UiHeader>
          <div class="details__item">
            <div class="details__item--label">Failure code</div>
            <div class="details__item--info">
              {{ payout.destination.failure_code }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Failure message</div>
            <div class="details__item--info">
              {{ payout.destination.failure_message }}
            </div>
          </div>
          <div class="details__item">
            <div class="details__item--label">Failure transaction</div>
            <div class="details__item--info">
              {{ payout.destination.failure_transaction }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentTab === 1" class="reports">
        <UiTable>
          <UiTableRow :isHead="true">
            <UiTableCell align="left">Period</UiTableCell>
            <UiTableCell align="left">Report date</UiTableCell>
            <UiTableCell align="left">Royalty report ID</UiTableCell>
            <UiTableCell align="left">Payment date</UiTableCell>
            <UiTableCell align="left">Amount</UiTableCell>
          </UiTableRow>

          <UiTableRow
            class="report"
            v-for="(report, index) in reports"
            :key="index"
          >
            <UiTableCell align="left">
              {{ getFormattedDate(report.period_from.seconds) }}
              —
              {{ getFormattedDate(report.period_to.seconds) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ getFormattedDate(report.created_at.seconds) }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ getValue(report, 'id') }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ getFormattedDate(report.payout_date.seconds) }}
            </UiTableCell>
            <UiTableCell align="left" :class="`status-${report.status}`">
              {{
              get(report, 'totals.payout_amount')
              ? $formatPrice(report.totals.payout_amount, report.currency)
              : '—'
              }}
            </UiTableCell>
          </UiTableRow>
        </UiTable>
      </div>
    </UiPanel>

    <ExportModal
      title="Export of payout"
      v-show="showModal"
      @export="exportFile"
      @close="showModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.period {
  margin-bottom: 14px;

  &-calendar {
    width: 15px;
    margin-right: 8px;
    position: relative;
    top: 2px;
    display: inline-block;
  }
}

.details {
  margin-top: 32px;

  &__header {
    margin-bottom: 16px;
    width: 100%;
  }

  &__container {
    display: flex;
    flex-wrap: wrap;
  }

  &__item {
    flex-basis: 50%;
    padding: 0 0 20px 12px;
    position: relative;

    &--label {
      color: #5E6366;
      font-size: 12px;
      margin-bottom: 5px;
    }

    &--info {
      color: #000;
      letter-spacing: 0.44px;
      overflow-wrap: break-word;
      max-width: 428px;
      overflow: hidden;
    }
  }

  .bordered {
    border-top: 1px solid rgba(227, 229, 230, .8);
    padding-top: 32px;
  }
}

.payout-panel {
  position: relative;

  .export-payout {
    background: #fff;
    position: absolute;
    top: 36px;
    right: 32px;
    padding-left: 32px;
  }
}

.export-button {
  width: 40px;
  height: 40px;
  display: flex !important;
  border: 1px solid #e3e5e6;
  box-sizing: border-box;
  border-radius: 4px;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  cursor: pointer;
  transition: all 0.2s ease-out;

  & > svg {
    fill: #78909C;
    transition: fill 0.2s ease-out;
  }

  &:hover {
    background: rgba(61, 123, 245, 0.08);

    & > svg {
      fill: #3d7bf5;
    }
  }
}

.details-info {
  position: absolute;
  left: -6px;
  top: 2px;

  svg {
    width: 12px;
    height: 12px;
    fill: #367BF5;
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
      content: '';
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

.reports {
  margin-top: 24px;
}
</style>
