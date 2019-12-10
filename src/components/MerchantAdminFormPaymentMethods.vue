<script>
import MerchantAdminChannelCostsTable from '@/components/MerchantAdminChannelCostsTable.vue';
import MerchantAdminChargebackTable from '@/components/MerchantAdminChargebackTable.vue';
import MerchantAdminRefundCostsTable from '@/components/MerchantAdminRefundCostsTable.vue';

export default {
  name: 'MerchantAdminFormPaymentMethods',
  components: {
    MerchantAdminChannelCostsTable,
    MerchantAdminChargebackTable,
    MerchantAdminRefundCostsTable,
  },
  props: {
    homeRegion: {
      default: 'europe',
      type: String,
    },
    payoutCurrency: {
      default: 'USD',
      type: String,
    },
    channelCosts: {
      required: true,
      type: Object,
    },
    chargeback: {
      required: true,
      type: Array,
    },
    refundCosts: {
      required: true,
      type: Object,
    },
    countries: {
      required: true,
      type: Array,
    },
    hasChanged: {
      default: false,
      type: Boolean,
    },
  },
  computed: {
    regions() {
      return {
        europe: { abbr: 'EU', label: 'European Union' },
        russia_and_cis: { abbr: 'RU & CIS', label: 'Russia & CIS' },
        asia: { abbr: 'Asia', label: 'Asia' },
        latin_america: { abbr: 'LA', label: 'Latin America' },
        worldwide: { abbr: 'WW', label: 'Worldwide' },
      };
    },
  },
};
</script>

<template>
<div class="merchant-admin-form-tariff">
  <UiPanel class="general-info-panel">
    <div class="general-info">
      <div class="general-item">
        <div class="general-item-icon">
          <IconEarthGlobe />
        </div>
        <div class="general-item-content">
          <UiHeader level="3">{{ regions[homeRegion].label }}</UiHeader>
          <p class="general-item-text">Home region</p>
        </div>
      </div>
      <div class="general-item">
        <div class="general-item-icon">
          <IconDollarInCircle />
        </div>
        <div class="general-item-content">
          <UiHeader level="3">{{ payoutCurrency }}</UiHeader>
          <p class="general-item-text">Payout currency</p>
        </div>
      </div>
    </div>
  </UiPanel>

  <UiPanel>
    <section class="section">
      <UiHeader level="3" :hasMargin="true">Channel costs</UiHeader>
      <UiText>
        Setup channel fees for available selection of payment methods.
      </UiText>

      <MerchantAdminChannelCostsTable
        :channelCosts="channelCosts"
        :countries="countries"
        @changeCell="$emit('updateChannelCost', $event)"
      />
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">Refund costs</UiHeader>
      <UiText>
        Setup refund fees for available selection of payment methods.
      </UiText>

      <MerchantAdminRefundCostsTable
        :refundCosts="refundCosts"
        :countries="countries"
        @changeCell="$emit('updateRefundCost', $event)"
      />
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">Chargeback</UiHeader>
      <UiText>
        Setup chargeback fees and operational limits.
        pecified values will be the same for all payment methods.
      </UiText>
      <MerchantAdminChargebackTable
        :chargeback="chargeback"
        :countries="countries"
        @changeCell="$emit('updateChargeback', $event)"
      />
    </section>

    <div class="controls">
      <UiButton
        class="submit-button"
        text="SAVE"
        :disabled="!hasChanged"
        @click="$emit('submitForms')"
      />
    </div>
  </UiPanel>
</div>
</template>

<style lang="scss" scoped>
.general-info-panel {
  margin-bottom: 8px;
}
.general-info {
  display: flex;
}
.general-item {
  width: 50%;
  display: flex;
}
.general-item-icon {
  width: 43px;
  display: flex;
  align-items: center;
}
.general-item-text {
  font-size: 12px;
  line-height: 16px;
  color: #5e6366;
}
.text {
  width: 448px;
  margin-bottom: 24px;
}
.payment-methods {
  display: flex;

  & > div {
    width: 33.333%;
  }
}
.switch-box {
  & + & {
    margin-top: 8px;
  }
}
.section {
  margin-bottom: 40px;
}
.controls {
  display: flex;
  justify-content: flex-end;
}
.submit-button {
  width: 140px;
}
</style>
