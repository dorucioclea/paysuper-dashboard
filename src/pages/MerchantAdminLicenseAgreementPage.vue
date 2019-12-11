<script>
import { mapState, mapActions } from 'vuex';
import { get, findKey, toNumber } from 'lodash-es';
import MerchantLicenseAgreementStore from '@/store/MerchantLicenseAgreementStore';
import PictureExcellentWork from '@/components/PictureExcellentWork.vue';
import PictureLicensePage from '@/components/PictureLicensePage.vue';
import MerchantAdminLicenseAgreement from '@/components/MerchantAdminLicenseAgreement.vue';
import merchantStatusScheme from '@/schemes/merchantStatusScheme';
import { showSuccessMessage } from '@/helpers/notifications';

export default {
  name: 'MerchantLicenseAgreementPage',
  components: {
    PictureExcellentWork,
    PictureLicensePage,
    MerchantAdminLicenseAgreement,
  },
  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule(
        'MerchantLicenseAgreement',
        MerchantLicenseAgreementStore,
        route.params.id,
      );
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },
  data() {
    return {
      hasInitSigned: true,
    };
  },
  computed: {
    ...mapState('Merchant', ['merchant']),
    ...mapState('MerchantLicenseAgreement', ['agreement', 'operatingCompanies', 'isAgreementLoading']),

    status() {
      return get(merchantStatusScheme, this.merchant.status, merchantStatusScheme[0]).value;
    },
    riskLevel() {
      return get(this.merchant, 'merchant_operations_type');
    },
    mccCode() {
      return get(this.merchant, 'mcc_code');
    },
    operatingCompanyId() {
      return get(this.merchant, 'operating_company_id', null);
    },
    hasSignature() {
      return this.merchant.has_merchant_signature || false;
    },
    isOpenedModal() {
      return !this.hasInitSigned && this.merchant.status === 4;
    },
  },
  mounted() {
    this.hasInitSigned = this.merchant.status === 4;
  },
  methods: {
    ...mapActions('Merchant', ['changeMerchantStatus', 'sendNotification']),
    ...mapActions('MerchantLicenseAgreement', ['uploadDocument', 'setOperatingCompany']),

    async sendMessage(message) {
      const success = await this.sendNotification({
        title: 'Message from PaySuper',
        message,
      });

      if (success) {
        showSuccessMessage('Message was sent', { position: 'bottom-center' });
      }
    },
    async changeStatus({ status, message }) {
      const success = await this.changeMerchantStatus({
        status: toNumber(findKey(merchantStatusScheme, { value: status })),
        message,
      });

      if (success) {
        showSuccessMessage('Status changed', { position: 'bottom-center' });
      }
    },
    async confirmOperatingCompany(id) {
      this.setOperatingCompany(id);
    },
  },
};
</script>

<template>
<div>
  <UiPageHeaderFrame>
    <span slot="title">License Agreement</span>
    <span slot="description">
      This is the main screen for merchant onboarding process.
      Here you will control the whole procedure, check statuses,
      lead communications and work with agreement documentation.
    </span>
    <PictureLicensePage slot="picture" />
  </UiPageHeaderFrame>

  <MerchantAdminLicenseAgreement
    :agreement="agreement"
    :merchantStatus="status"
    :hasSignature="hasSignature"
    :operatingCompanies="operatingCompanies"
    :operatingCompanyId="operatingCompanyId"
    :riskLevel="riskLevel"
    :mccCode="mccCode"
    :isAgreementLoading="isAgreementLoading"
    @sendMessage="sendMessage"
    @changeStatus="changeStatus"
    @uploadDocument="uploadDocument"
    @confirm="confirmOperatingCompany"
  />

  <UiModal
    v-if="isOpenedModal"
    width="448px"
  >
    <template slot="header">
      <PictureExcellentWork class="picture" />
      <UiHeader
        level="3"
        align="center"
        :hasMargin="true"
      >
        Excellent work!
      </UiHeader>
    </template>
    <div class="modal-content">
      Now agreement is signed by both sides and this company's request moved to a Merchants list.
    </div>
    <div class="modal-controls">
      <UiButton @click="hasInitSigned = true">DONE</UiButton>
    </div>
  </UiModal>
</div>
</template>

<style lang="scss" scoped>
.picture {
  width: 100%;
  margin: 16px 0;
}
.modal-content {
  font-family: Roboto;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.25px;
  color: #5e6366;
  text-align: center;
  margin-bottom: 24px;
}
.modal-controls {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
</style>
