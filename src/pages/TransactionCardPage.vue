<script>
import { mapActions, mapState, mapGetters } from 'vuex';
import {
  get, find, isEmpty,
} from 'lodash-es';
import { format } from 'date-fns';
import TransactionPageStore from '@/store/TransactionPageStore';
import TransactionRefund from '@/components/TransactionRefund.vue';

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
  name: 'transactionsCard',
  components: { TransactionRefund },

  data() {
    return {
      colors: STATUS_COLOR,
      showRefundModal: false,
    };
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('TransactionPage', TransactionPageStore, {
        transactionId: route.params.transactionId,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  watch: {
    $route() {
      this.initState({ transactionId: this.$route.params.transactionId });
    },
  },

  computed: {
    ...mapState('TransactionPage', ['transaction']),
    ...mapGetters('Dictionaries', ['countries']),
    ...mapGetters('User', ['userPermissions']),

    refundAvailable() {
      return this.transaction.refund_allowed && this.userPermissions.cancelTransactions;
    },

    address() {
      if (!this.transaction.user.address) {
        return '—';
      }
      return [
        this.transaction.user.address.city,
        this.transaction.user.address.state,
        this.getCountryByCode(this.transaction.user.address.country),
        this.transaction.user.address.postal_code,
      ].filter(i => i).join(', ');
    },
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('TransactionPage', ['refund', 'initState']),

    get,

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

    async handleRefund(reason) {
      this.setIsLoading(true);
      await this.refund({ transaction: this.transaction, reason }).catch(this.$showErrorMessage);
      this.setIsLoading(false);
      this.$navigate('/transactions/');
    },

    hasCurrency(value) {
      if (value === undefined || isEmpty(value) || value.amount === undefined) {
        return false;
      }
      return value.currency !== '';
    },
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame class="transaction-page-header">
      <template slot="title">
        Transaction {{ transaction.transaction }}
      </template>
      <span slot="description">
        <UiLabelTag :color="colors[transaction.status]">{{ transaction.status }}</UiLabelTag>
      </span>
      <UiButton
        v-if="refundAvailable"
        slot="picture"
        color="blue"
        class="refund-button"
        :isTransparent="true"
        @click="showRefundModal = true"
      >
        REFUND
      </UiButton>

    </UiPageHeaderFrame>

    <TransactionRefund
      :showModal="showRefundModal"
      @close="showRefundModal = false"
      @input="handleRefund($event)"
    ></TransactionRefund>

    <UiPanel>
      <div class="details bordered">
        <UiHeader level="3" class="details__header">Transaction details</UiHeader>
        <div class="details__container">
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Order uid</div>
              <div class="details__item--info">
                {{ transaction.uuid }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Payment date</div>
              <div class="details__item--info">
                {{ formatDateAndTime(transaction.created_at.seconds) }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Project</div>
              <div class="details__item--info">
                {{ transaction.project.name.en }}
              </div>
            </div>
            <div class="details__item"
                 v-if="transaction.items === null || transaction.items.length === 1">
              <div class="details__item--label">Products</div>
              <div class="details__item--info">
                {{ getProductName(transaction.items) }}
              </div>
            </div>

            <div class="details__item">
              <div class="details__item--label">Payment method</div>
              <div class="details__item--info">
                {{ transaction.payment_method.title }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Country</div>
              <div class="details__item--info">
                {{ getCountryByCode(transaction.country_code) }}
              </div>
            </div>
            <div class="details__item" v-if="transaction.billing_address">
              <div class="details__item--label">Billing address</div>
              <div class="details__item--info">
                {{ getCountryByCode(transaction.billing_address.country) }}
              </div>
            </div>
          </div>

          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Total order amount</div>
              <div class="details__item--info">
                {{ $formatPrice(transaction.total_payment_amount, transaction.currency) }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Total charge summ</div>
              <div class="details__item--info">
                {{ $formatPrice(
                  transaction.order_charge.amount,
                  transaction.order_charge.currency
                ) }}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.gross_revenue)">
              <div class="details__item--label">Gross revenue</div>
              <div class="details__item--info">
                {{ $formatPrice(
                    transaction.gross_revenue.amount,
                    transaction.gross_revenue.currency) }}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.method_fee_total)">
              <div class="details__item--label">Paysuper Method Fee</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.method_fee_total.amount,
                transaction.method_fee_total.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.paysuper_fixed_fee)">
              <div class="details__item--label">PaySuper Fixed Fee</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.paysuper_fixed_fee.amount,
                transaction.paysuper_fixed_fee.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.fees_total)">
              <div class="details__item--label">Fees Total</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.fees_total.amount,
                transaction.fees_total.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.tax_fee_total)">
              <div class="details__item--label">VAT Tax Fee</div>
              <div class="details__item--info">
                {{$formatPrice(
                  transaction.tax_fee_total.amount,
                  transaction.tax_fee_total.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.net_revenue)">
              <div class="details__item--label">Net Revenue</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.net_revenue.amount,
                transaction.net_revenue.currency)}}
              </div>
            </div>

            <div class="details__item" v-if="hasCurrency(transaction.refund_gross_revenue)">
              <div class="details__item--label">Refund Gross Revenue</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.refund_gross_revenue.amount,
                transaction.refund_gross_revenue.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.refund_fees_total)">
              <div class="details__item--label">Refund Reverse Fees</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.refund_fees_total.amount,
                transaction.refund_fees_total.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="hasCurrency(transaction.refund_tax_fee_total)">
              <div class="details__item--label">Refund VAT Tax Fee</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.refund_tax_fee_total.amount,
                transaction.refund_tax_fee_total.currency)}}
              </div>
            </div>
            <div class="details__item"
                 v-if="hasCurrency(transaction.refund_reverse_revenue)">
              <div class="details__item--label">Refund Reverse Revenue</div>
              <div class="details__item--info">
                {{$formatPrice(
                transaction.refund_reverse_revenue.amount,
                transaction.refund_reverse_revenue.currency)}}
              </div>
            </div>
            <div class="details__item" v-if="transaction.refund && transaction.refund !== null">
              <div class="details__item--label">Refund reason</div>
              <div class="details__item--info">
                {{transaction.refund.reason}}
              </div>
            </div>
            <div
              v-if="transaction.parent_order && transaction.parent_order !== null"
              class="details__item"
            >
              <div class="details__item--label">Original transaction</div>
              <div class="details__item--info">
                <RouterLink
                  :to="{
                    name: 'TransactionsCard',
                    params: {transactionId: transaction.parent_order.uuid}
                  }"
                >
                  {{transaction.parent_order.uuid}}
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="details bordered" v-if="transaction.items && transaction.items.length > 1">
        <UiHeader level="3" class="details__header">Products</UiHeader>
        <div class="products" v-if="transaction.items && transaction.items.length > 1">
          <UiTable>
            <UiTableRow :isHead="true">
              <UiTableCell width="50%" align="left" class="products__head">
                Products
              </UiTableCell>
              <UiTableCell width="50%" align="left" class="products__head products__shift">
                Product price
              </UiTableCell>
            </UiTableRow>
            <UiTableRow v-for="(product, index) in transaction.items" :key="index">
              <UiTableCell align="left" class="products__cell">{{product.name}}</UiTableCell>
              <UiTableCell align="left" class="products__cell products__shift">
                {{ $formatPrice(product.amount, product.currency) }}
              </UiTableCell>
            </UiTableRow>
          </UiTable>
        </div>
      </div>

      <div class="details bordered">
        <UiHeader level="3" class="details__header">User info</UiHeader>
        <div class="details__container">
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">User ID</div>
              <div class="details__item--info">
                {{ transaction.user.id }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">IP</div>
              <div class="details__item--info">
                {{ transaction.user.ip }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Locale</div>
              <div class="details__item--info">
                {{ transaction.user.locale }}
              </div>
            </div>
          </div>
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Email</div>
              <div class="details__item--info">
                {{ transaction.user.email }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Address</div>
              <div class="details__item--info">
                {{ address }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Phone</div>
              <div class="details__item--info">
                {{ transaction.user.phone !== '' ? transaction.user.phone : '—' }}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div
        v-if="transaction.payment_method && transaction.payment_method.card"
        class="details bordered"
      >
        <UiHeader level="3" class="details__header">Payment details</UiHeader>
        <div class="details__container">
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Type of card</div>
              <div class="details__item--info">
                {{ transaction.payment_method.card.brand }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Card expiry month/year</div>
              <div class="details__item--info">
                {{ transaction.payment_method.card.expiry_month }}
                /
                {{ transaction.payment_method.card.expiry_year }}
              </div>
            </div>
          </div>
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Card number</div>
              <div class="details__item--info">
                {{ transaction.payment_method.card.masked }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">3D Secure</div>
              <div class="details__item--info">
                {{ transaction.payment_method.card.secure3d }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="details">
        <UiHeader level="3" class="details__header">Issuer</UiHeader>
        <div class="details__container">
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Embedded</div>
              <div class="details__item--info">
                {{ transaction.issuer.embedded }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">URL</div>
              <div class="details__item--info">
                <template v-if="transaction.issuer.url !== ''">
                  <a :href="transaction.issuer.url">{{ transaction.issuer.url }}</a>
                </template>
                <template v-else>
                  &mdash;
                </template>
              </div>
            </div>
          </div>
          <div class="details__column">
            <div class="details__item">
              <div class="details__item--label">Reference</div>
              <div class="details__item--info">
                {{ transaction.issuer.reference !== '' ? transaction.issuer.reference : '—' }}
              </div>
            </div>
            <div class="details__item">
              <div class="details__item--label">Reference host</div>
              <div class="details__item--info">
                {{ transaction.issuer.referrer_host }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UiPanel>
  </div>
</template>

<style lang="scss" scoped>
.transaction-page-header {
  position: relative;
}

.refund-button {
  width: 140px;
  height: 40px;
  position: absolute !important;
  top: 20px;
  right: 0;
}

.details {
  margin-bottom: 32px;

  &.bordered {
    border-bottom: 1px solid rgba(227, 229, 230, 0.8);
  }

  &__header {
    margin-bottom: 16px;
  }

  &__container {
    display: flex;
    flex-wrap: wrap;
  }

  &__column {
    flex-basis: 50%;
  }

  &__item {
    padding: 0 0 20px 12px;

    &--label {
      color: #5e6366;
      font-size: 12px;
      margin-bottom: 5px;
    }

    &--info {
      color: #000;
      letter-spacing: 0.44px;
    }
  }

  .products {
    flex-basis: 100%;
    width: 100%;
    padding: 0 0 20px 12px;
    margin-bottom: 32px;

    &__head {
      color: #5e6366;
      font-size: 12px;
      padding: 0;
      border-bottom: none;
    }

    &__cell {
      color: #000;
      letter-spacing: 0.44px;
      padding: 10px 0;
      border-bottom: 1px dashed #c6cacc;
    }

    &__shift {
      padding-left: 5px;
    }
  }
}
</style>
