<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import { get } from 'lodash-es';
import MerchantTariffStore from '@/store/MerchantTariffStore';
import MerchantAdminFormPaymentMethods from '@/components/MerchantAdminFormPaymentMethods.vue';

export default {
  name: 'MerchantAdminPaymentMethodPage',
  components: {
    MerchantAdminFormPaymentMethods,
  },
  asyncData({ registerStoreModule, route }) {
    const merchantId = route.params.id;
    return registerStoreModule(
      'MerchantTariff',
      MerchantTariffStore,
      merchantId,
    );
  },
  computed: {
    ...mapState('Merchant', ['merchant']),
    ...mapState('MerchantTariff', ['channelCosts', 'chargeback', 'refundCosts', 'isLoading']),
    ...mapGetters('MerchantTariff', ['hasChanged']),

    homeRegion() {
      return get(this.merchant, 'tariff.home_region') || 'europe';
    },
    payoutCurrency() {
      return get(this.merchant, 'banking.currency') || 'USD';
    },
  },
  methods: {
    ...mapActions('MerchantTariff', [
      'updateChannelCost',
      'updateRefundCost',
      'updateChargeback',
      'save',
    ]),
  },
};
</script>

<template>
<div class="merchant-admin-card-payment-method-page">
  <header class="header">
    <UiHeader level="2" :hasMargin="true">Payment methods</UiHeader>
    <p class="text">
      Customise a unique setup of payment methods, commissions and rates.
      Every merchant must be setup individually, since not all methods and rates are available
      for all merchants. Edit respective table values right in their cells.
    </p>
  </header>

  <MerchantAdminFormPaymentMethods
    :homeRegion="homeRegion"
    :payoutCurrency="payoutCurrency"
    :channelCosts="channelCosts"
    :chargeback="chargeback"
    :refundCosts="refundCosts"
    :isLoading="isLoading"
    @updateChannelCost="updateChannelCost"
    @updateRefundCost="updateRefundCost"
    @updateChargeback="updateChargeback"
  >
    <div
      slot="controls"
      class="controls"
    >
      <UiButton
        class="submit-button"
        text="SAVE"
        :disabled="!hasChanged"
        @click="save"
      >
        <UiSimplePreloader
          v-if="isLoading"
          slot="iconBefore"
        />
      </UiButton>
    </div>
  </MerchantAdminFormPaymentMethods>
</div>
</template>

<style lang="scss" scoped>
.header {
  margin-bottom: 32px;
}
.text {
  width: 448px;
}
.controls {
  display: flex;
  justify-content: flex-end;
}
.submit-button {
  width: 140px;
}
</style>
