<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import { required } from 'vuelidate/lib/validators';
import { get, find, truncate } from 'lodash-es';
import Notifications from '@/mixins/Notifications';

export default {
  name: 'PaymentMethods',
  mixins: [Notifications],
  data() {
    return {
      hasCountriesOpened: false,
      hasCustomersTipOpened: false,
      hasOverallFeeOpened: false,
      riskLevelList: [
        {
          label: 'Low risk',
          value: 'low-risk',
        },
        {
          label: 'High risk',
          value: 'high-risk',
        },
      ],
    };
  },
  validations: {
    region: { required },
  },
  computed: {
    ...mapState('Company/Tariff', [
      'amount',
      'amounts',
      'currency',
      'payerRegion',
      'region',
      'regions',
      'operationsType',
      'chargeback',
      'payout',
      'minimalPayout',
    ]),
    ...mapState('User/Merchant', ['merchant', 'onboardingSteps']),
    ...mapGetters('User', ['userPermissions']),

    viewOnly() {
      return !this.userPermissions.editCompany;
    },
    accountCurrency() {
      return get(this.merchant, 'banking.currency', 'USD');
    },
    accountPayout() {
      return get(this.payout, this.accountCurrency, {});
    },
    status() {
      return this.merchant.status;
    },
    amountsOptions() {
      return this.amounts.map(amount => ({ label: `${amount} ${this.currency}`, value: amount }));
    },
    prepareCountries() {
      const region = this.regions[this.region];
      return region
        ? truncate(region.countries.join(', '), { length: 800, separator: /,? +/ })
        : 'List countries for region';
    },
    prepareRegions() {
      return [
        { label: 'European Union', value: 'europe', abbr: 'EU' },
        { label: 'Russia & CIS', value: 'russia_and_cis', abbr: 'RU & CIS' },
        { label: 'Asia', value: 'asia', abbr: 'Asia' },
        { label: 'Latin America', value: 'latin_america', abbr: 'LA' },
        { label: 'Worldwide', value: 'worldwide', abbr: 'WW' },
      ];
    },
    payerRegionAbbr() {
      return get(find(this.prepareRegions, { value: this.payerRegion }), 'abbr', '');
    },
    channelCosts() {
      return get(
        this.regions,
        `${this.region}.payerRegions.${this.payerRegion}`,
        {},
      )[this.amount] || [];
    },
    isOneLineCountries() {
      return this.prepareCountries.length < 44;
    },
  },
  async mounted() {
    try {
      this.updateOperationsType(get(this.merchant, 'merchant_operations_type', 'low-risk'));
      await this.initState();
    } catch (error) {
      this.$_Notifications_showErrorMessage(error);
    }
  },
  methods: {
    ...mapActions('Company/Tariff', [
      'initState',
      'submitTariffs',
      'updateAmount',
      'updatePayerRegion',
      'updateRegion',
      'updateOperationsType',
    ]),

    async submit() {
      this.$v.region.$touch();

      if (!this.$v.region.$invalid) {
        try {
          const hasSubmit = await this.submitTariffs();

          if (hasSubmit) {
            this.$emit('hasSubmit');
          }
        } catch (error) {
          this.$_Notifications_showErrorMessage(error);
        }
      }
    },
  },
};
</script>

<template>
<div class="payment-methods">
  <div class="section">
    <div class="info">
      This important choice will define your future money flow rates and commissions,
      so check the variants below carefully, since you won’t be able
      to change these parameters in future.
    </div>

    <div class="select">
      <UiSelect
        v-bind="$getValidatedFieldProps('region')"
        label="Home Region"
        :options="prepareRegions"
        :value="region"
        :disabled="status !== 0"
        @input="updateRegion($event)"
        @blur="$v.region.$touch()"
      />
      <div
        class="icon-wrapper"
        @mouseenter="hasCountriesOpened = true"
        @mouseleave="hasCountriesOpened = false"
      >
        <IconQuestion class="question" />
        <UiTip
          :class="['tip', { '_nowrap': isOneLineCountries }]"
          innerPosition="left"
          position="top"
          maxWidth="280px"
          :width="isOneLineCountries ? 'auto' : 'calc(100vw - 320px)'"
          :hasCaret="true"
          :visible="hasCountriesOpened"
        >
          {{ prepareCountries }}
        </UiTip>
      </div>
    </div>
  </div>

  <section class="section">
    <div class="title">Risk level of company products</div>
    <p class="text">
      Choose <span class="bolder">High risk</span> if you plan to sell any age restricted content,
      like high level of gore and violence. If you plan to sell products without any distribution
      restrictions choose <span class="bolder">Low risk</span>.
    </p>
    <div class="radio-group">
      <UiRadio
        class="radio"
        v-for="item in riskLevelList"
        :checked="item.value === operationsType"
        :key="item.value"
        :value="item.value"
        :disabled="status !== 0 && item.value !== operationsType"
        @change="updateOperationsType($event)"
      >
        {{ item.label }}
      </UiRadio>
    </div>
  </section>

  <div class="section">
    <div class="title">Channel costs</div>
    <div class="info">
      You can find how your chosen pair <span class="bolder">Home Region</span> and
      <span class="bolder">Payout Currency</span> affects on different payment methods fees.
    </div>

    <div class="select">
      <UiSelect
        label="Payment Amount"
        maxHeight="240px"
        :options="amountsOptions"
        :value="amount"
        :disabled="viewOnly"
        @input="updateAmount($event)"
      />
    </div>

    <div class="tabs-info">
      <div
        class="icon-wrapper"
        @mouseenter="hasCustomersTipOpened = true"
        @mouseleave="hasCustomersTipOpened = false"
      >
        <IconQuestion class="question" />
        <UiTip
          class="tip"
          innerPosition="left"
          position="top"
          width="calc(100vw - 320px)"
          maxWidth="280px"
          :hasCaret="true"
          :visible="hasCustomersTipOpened"
        >
          You can check here how your choice of <span class="bolder">Home Region</span>
          and <span class="bolder">Payout Currency</span> will affect
          on rates and fees, if your customer will pay from another region.
        </UiTip>
      </div>
      External regions rates ({{ payerRegionAbbr }})
    </div>
    <div class="tabs">
      <UiButton
        v-for="(region, index) in prepareRegions"
        :key="index"
        class="tabs-btn"
        color="light-gray"
        :isRounded="true"
        :isTransparent="payerRegion !== region.value"
        @click="updatePayerRegion(region.value)"
      >
        {{ region.label }}
      </UiButton>
    </div>

    <transition name="table" mode="out-in">
      <UiTable v-if="channelCosts.length">
        <UiTableRow :isHead="true" class="row-indent">
          <UiTableCell class="cell _second" align="left">
            Payment Method
          </UiTableCell>
          <UiTableCell class="cell _channel">
            Method fee
          </UiTableCell>
          <UiTableCell class="cell _channel">
            Fixed fee
          </UiTableCell>
          <UiTableCell class="cell _channel">
            <div
              class="icon-before-text"
              @mouseenter="hasOverallFeeOpened = true"
              @mouseleave="hasOverallFeeOpened = false"
            >
              <IconQuestion class="question" />
              <UiTip
                class="tip"
                innerPosition="left"
                position="top"
                width="210px"
                :margin="10"
                :hasCaret="true"
                :visible="hasOverallFeeOpened"
              >
                Overall fee is a sum of method and fixed fees.
              </UiTip>
            </div>
            Overall fee
          </UiTableCell>
          <UiTableCell class="cell _channel">
            PS general fixed fee
          </UiTableCell>
        </UiTableRow>
        <UiTableRow
          v-for="(data, index) in channelCosts"
          :key="index"
        >
          <UiTableCell class="cell _first">
            <component
              :is="$options.components[data.icon] ? data.icon : 'IconDirectBanking'"
              class="method-icon"
            />
          </UiTableCell>
          <UiTableCell class="cell _second" align="left">
            {{ data.method }}
          </UiTableCell>
          <UiTableCell class="cell _channel">
            <span class="cell-blue-transparent">
              {{ data.methodFee }}%
            </span>
          </UiTableCell>
          <UiTableCell class="cell _channel">
            <span class="cell-blue-transparent">
              {{ $formatPrice(data.fixedFee, currency) }}
            </span>
          </UiTableCell>
          <UiTableCell class="cell _channel">
            <span class="cell-blue">
              {{ data.overallFee }}%
            </span>
          </UiTableCell>
          <UiTableCell class="cell _channel">
            {{ $formatPrice(data.psGeneralFixedFee, currency) }}
          </UiTableCell>
        </UiTableRow>
      </UiTable>
    </transition>
  </div>

  <div class="section">
    <div class="title">Refund costs</div>
    <div class="info">
      Check the refund fees policy below.
      Notice that all refund fees are being paid by PaySuper, so they are
      <span class="bolder">free of charge for you</span>.
    </div>
  </div>

  <div class="section">
    <div class="title">Chargeback</div>
    <div class="info">
      Pay attention to our chargeback policy.
      Every such transaction has a fixed cost, mentioned below.
    </div>

    <UiTable>
      <UiTableRow :isHead="true" class="row-indent">
        <UiTableCell class="cell _second" align="left">Payment Method</UiTableCell>
        <UiTableCell class="cell _merch">Chargeback fixed fee</UiTableCell>
        <UiTableCell class="cell _merch">Chargeback fee payout party</UiTableCell>
      </UiTableRow>
      <UiTableRow class="row-indent"
        v-for="(item, index) in chargeback"
        :key="index"
      >
        <UiTableCell class="cell _second" align="left">
          {{ item.method_name }}
        </UiTableCell>
        <UiTableCell class="cell _merch">
          {{ $formatPrice(item.method_fixed_fee, item.method_fixed_fee_currency) }}
        </UiTableCell>
        <UiTableCell class="cell _merch">
          {{ item.is_paid_by_merchant ? 'Merchant' : 'PaySuper' }}
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>

  <div class="section">
    <div class="title">Payout costs</div>
    <div class="info">
      Please notice there is a fixed service price for every payout transaction.
    </div>

    <UiTable>
      <UiTableRow :isHead="true" class="row-indent">
        <UiTableCell class="cell _second" align="left">Payment currency</UiTableCell>
        <UiTableCell class="cell _merch">Payout fixed fee</UiTableCell>
        <UiTableCell class="cell _merch">Fee payout party</UiTableCell>
        <UiTableCell class="cell _merch">Minimal payout</UiTableCell>
      </UiTableRow>
      <UiTableRow class="row-indent">
        <UiTableCell class="cell _second" align="left">{{ accountCurrency }}</UiTableCell>
        <UiTableCell class="cell _merch">
          {{
            $formatPrice(
              accountPayout.method_fixed_fee,
              accountPayout.method_fixed_fee_currency,
            )
          }}
        </UiTableCell>
        <UiTableCell class="cell _merch">
          {{ accountPayout.is_paid_by_merchant ? 'Merchant' : 'PaySuper' }}
        </UiTableCell>
        <UiTableCell class="cell _merch">
          {{
            $formatPrice(
              minimalPayout[accountPayout.method_fixed_fee_currency],
              accountPayout.method_fixed_fee_currency
            )
          }}
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>

  <UiButton
    v-if="!viewOnly"
    class="submit"
    color="green"
    :disabled="onboardingSteps.tariff || status !== 0"
    @click="submit"
  >
    SUBMIT APPLICATION
  </UiButton>
</div>
</template>

<style lang="scss" scoped>
.payment-methods {
  display: flex;
  flex-direction: column;
}
.section {
  margin-bottom: 32px;
}
.title {
  font-family: Quicksand;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0.15px;
  color: #000;
  margin-bottom: 8px;
}
.info {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.25px;
  color: #5e6366;
  margin-bottom: 20px;
  max-width: 420px;
}
.select {
  position: relative;
  width: 100%;
}
.icon-wrapper {
  position: absolute;
  display: flex;
  left: -4px;
  top: 9px;
}
.question {
  fill: #3d7bf5;
  cursor: pointer;

  &:hover {
    fill: #5e6366;
  }
}
.tip {
  background-color: #000;
  padding: 12px;
  color: #fff;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.4px;
  margin-left: -21px;

  &._nowrap {
    white-space: nowrap;
  }

  &::after {
    border-top-color: #000;
  }
}
.note {
  display: flex;
}
.icon-info {
  margin-left: -6px;
  margin-right: 6px;
  fill: #ea3d2f;
  flex-shrink: 0;
  width: 12px;
}
.note-text {
  flex-basis: 568px;
}
.tabs-info {
  position: relative;
  letter-spacing: 0.4px;
  color: #5e6366;
  font-size: 12px;
  line-height: 32px;
  padding-left: 12px;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.tabs > .tabs-btn {
  font-weight: normal;
  letter-spacing: 0.25px;
  margin-bottom: 4px;
  margin-right: 4px;
  padding: 6px 24px;
}
.method-icon {
  width: 32px;
  height: 18px;
  display: table-cell;
}
.bolder {
  font-weight: 500;
}
.blue-text {
  color: #3d7bf5;
}
.row-indent {
  &::before {
    content: "";
    display: table-cell;
    width: 40px;
    border-bottom: 2px solid #e3e5e6;
  }
}
.cell {
  &._first {
    width: 40px;
  }
  &._second {
    min-width: 170px;
  }
  &._channel {
    width: 19.5%;
  }
  &._refund {
    width: 26%;
  }
  &._merch {
    width: 39%;
  }
}
.table-enter,
.table-leave-active {
  opacity: 0;
}
.table-enter-active,
.table-leave-active {
  transition: opacity 0.2s ease-out;
}
.submit {
  min-width: 180px;
  align-self: flex-end;
  letter-spacing: 0.75px;
}
.icon-before-text {
  position: relative;
  top: 1px;
  display: inline-block;
}
.cell-blue {
  display: inline-block;
  width: 72px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  background: rgba(#daf5f2, 0.5);
  border-radius: 2px;
  border: 1px solid transparent;
  &-transparent {
    width: 72px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    display: inline-block;
    background-color: transparent;
    border: 1px solid rgba(#069697, 0.2);
  }
}
.radio-group {
  margin: 22px 0 20px;
}

.radio {
  & + & {
    margin-top: 12px;
  }
}
</style>
