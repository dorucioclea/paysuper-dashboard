<script>
import { find, includes } from 'lodash-es';
import MerchantAdminModal from '@/components/MerchantAdminModal.vue';
import merchantStatusScheme from '@/schemes/merchantStatusScheme';
import { showErrorMessage } from '@/helpers/notifications';

export default {
  name: 'MerchantAdminLicenseAgreement',
  components: { MerchantAdminModal },
  props: {
    agreement: {
      required: true,
      type: Object,
    },
    hasSignature: {
      default: false,
      type: Boolean,
    },
    isAgreementLoading: {
      default: false,
      type: Boolean,
    },
    merchantStatus: {
      default: 'new',
      type: String,
    },
    operatingCompanies: {
      default: () => [],
      type: Array,
    },
    operatingCompanyId: {
      default: null,
      type: String,
    },
    riskLevel: {
      default: null,
      type: String,
    },
    mccCode: {
      default: null,
      type: String,
    },
  },
  data() {
    return {
      newStatus: this.merchantStatus,
      modalOpened: false,
      modalType: 'contact',
      checkedCompanyId: null,
      operatingCompanyLabel: '',
      showOperatingCompanyConfirm: false,
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
  computed: {
    statuses() {
      const currentStatus = find(
        merchantStatusScheme,
        { value: this.merchantStatus },
      ) || merchantStatusScheme[0];

      if (includes(['new', 'signing', 'pending', 'accepted'], currentStatus.value)) {
        return [currentStatus, merchantStatusScheme[6]];
      }

      return [currentStatus];
    },
    actualStatus() {
      return find(this.statuses, { value: this.newStatus });
    },
    statusFrom() {
      return find(this.statuses, { value: this.merchantStatus });
    },
  },
  methods: {
    sendMessage(message) {
      if (this.modalType === 'changeStatus') {
        this.changeStatus(message);
      } else {
        this.$emit('sendMessage', message);
      }
      this.modalOpened = false;
    },
    openChangeStatusModal(status) {
      if (status !== 'rejected') {
        showErrorMessage('You can change status to rejected only', { position: 'bottom-center' });
        return;
      }
      this.newStatus = status;
      this.modalType = 'changeStatus';
      this.modalOpened = true;
    },
    changeStatus(message) {
      this.$emit('changeStatus', { status: this.newStatus, message });
    },
    openContactModal() {
      this.modalType = 'contact';
      this.modalOpened = true;
    },
    closeModal() {
      if (this.modalType === 'changeStatus') {
        this.newStatus = this.merchantStatus;
      }
      this.modalOpened = false;
    },
    uploadDocument() {
      this.$emit('uploadDocument');
    },
    openLicense() {
      this.$emit('openLicense');
    },
    updateOperatingCompany(value, label) {
      this.checkedCompanyId = value;
      this.operatingCompanyLabel = label;
      this.showOperatingCompanyConfirm = true;
    },
    async confirmOperatingCompany() {
      await this.$emit('confirm', this.checkedCompanyId);
      this.showOperatingCompanyConfirm = false;
    },
  },
  watch: {
    merchantStatus(val) {
      this.newStatus = val;
    },
  },
};
</script>

<template>
<UiPanel>
  <section
    v-if="hasSignature"
    class="section"
  >
    <UiHeader level="3" :hasMargin="true">
      PDF file
    </UiHeader>
    <UiText>
      When merchant signs the license agreement it can be dowloaded here
      for future reference and sending it to risk manager for KYC.
    </UiText>
    <div class="agreement">
      <IconFile v-if="agreement.metadata.size" />
      <IconFileLoader v-else />
      <div class="agreement-text">
        <div class="first-line">License Agreement.{{ agreement.metadata.extension }}</div>
      </div>
    </div>
    <div class="links">
      <a
        v-if="agreement.metadata.size"
        :class="['link', { '_disabled': isAgreementLoading }]"
        :href="agreement.url"
        @click.prevent="uploadDocument"
      >
        <IconDownload class="icon" />
        DOWNLOAD
        <UiSimplePreloader
          v-if="isAgreementLoading"
          class="agreement-preloader"
        />
      </a>
    </div>
  </section>
  <section
    v-if="riskLevel"
    class="section"
  >
    <UiHeader level="3" :hasMargin="true">
      Risk level of company products
    </UiHeader>
    <div class="radio-group">
      <UiRadio
        class="radio"
        v-for="item in riskLevelList"
        :checked="item.value === riskLevel"
        :key="item.value"
        :value="item.value"
        :disabled="item.value !== riskLevel"
      >
        {{ item.label }} {{ item.value === riskLevel ? `(MCC: ${mccCode})` : '' }}
      </UiRadio>
    </div>
  </section>
  <section
    v-if="merchantStatus !== 'new'"
    class="section"
  >
    <UiHeader level="3" :hasMargin="true">
      Signing companies
    </UiHeader>
    <UiText>
      Choose Maltese signing company for any merchants from Russia, Belarus,
      Cyprus and for all high risk merchants from any country.
      Choose Cyprus signing company for low risk merchants and the rest of the countries.
    </UiText>
    <div class="radio-group">
      <UiRadio
        class="radio"
        v-for="item in operatingCompanies"
        :checked="item.value === checkedCompanyId || item.value === operatingCompanyId"
        :disabled="operatingCompanyId !== null && item.value !== operatingCompanyId"
        :key="item.value"
        :value="item.value"
        @change="updateOperatingCompany($event, item.label)"
      >
        {{ item.label }}
      </UiRadio>
    </div>
  </section>
  <section class="section">
    <UiHeader level="3" :hasMargin="true">
      Status
    </UiHeader>
    <UiText>
      Choose the actual status for every step of onboarding procedure.
      Merchant will get different notifications depending on the LA request status.
    </UiText>
    <div
      v-if="merchantStatus === 'new'"
      class="no-agreement"
    >
      No agreement
    </div>
    <template v-else>
      <UiSelectAsButton
        v-if="statuses.length > 1"
        tipInnerPosition="left"
        textColor="white"
        :color="actualStatus.color"
        :isRounded="true"
        :options="statuses"
        :value="newStatus"
        @input="openChangeStatusModal"
      />
      <UiButton
        v-else
        size="small"
        :color="actualStatus.color"
        :isRounded="true"
      >
        {{ actualStatus.label }}
      </UiButton>
    </template>
  </section>
  <section class="footer">
    <div
      class="link"
      @click="openContactModal"
    >
      <IconEdit class="icon" />
      Contact merchant
    </div>
  </section>
  <MerchantAdminModal
    v-if="modalOpened"
    :statusFrom="statusFrom"
    :statusTo="actualStatus"
    :type="modalType"
    @close="closeModal"
    @send="sendMessage"
  />
  <UiConfirm
    v-if="showOperatingCompanyConfirm"
    :title="operatingCompanyLabel"
    buttonText="CONFIRM"
    buttonColor="blue"
    @close="showOperatingCompanyConfirm=false"
    @confirm="confirmOperatingCompany">
      Are you sure of choosing
      {{ operatingCompanyLabel }}
      because you can’t change it in the future?
  </UiConfirm>
</UiPanel>
</template>

<style lang="scss" scoped>
.section {
  padding-bottom: 32px;
  margin-bottom: 32px;
  border-bottom: 1px solid #e8eaeb;
}
.footer {
  display: flex;
  flex-basis: 100%;
  justify-content: flex-end;
}
.agreement {
  display: flex;
  margin-bottom: 16px;
}
.no-agreement {
  display: inline-flex;
  align-items: center;
  border: 1px solid #e3e5e6;
  border-radius: 16px;
  padding: 0 16px;
  height: 32px;
  color: #919699;
  letter-spacing: 0.1px;
  font-family: Roboto;
  font-weight: 500;
  font-size: 14px;
  cursor: default;
}
.link {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.75px;
  text-transform: uppercase;
  color: #3d7bf5;
  transition: color 0.2s ease-out;
  line-height: 24px;

  & > svg {
    transition: fill 0.2s ease-out;
  }

  &:hover {
    color: rgba(#3d7bf5, 0.85);

    & > svg {
      fill: rgba(#3d7bf5, 0.85);
    }
  }

  &:active {
    color: #3d7bf5;

    & > svg {
      fill: #3d7bf5;
    }
  }

  &._disabled {
    pointer-events: none;
    cursor: default;
    color: #5e6366;
  }

  & ~ & {
    margin-left: 20px;
    padding-left: 20px;
    border-left: 1px solid #e3e5e6;
  }
}
.agreement-preloader {
  margin-left: 12px;
}
.agreement-text {
  font-family: Roboto;
  padding-left: 12px;
  font-weight: 500;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.1px;
  margin-bottom: 2px;
  color: #000;
}
.icon {
  margin-right: 8px;
  fill: #3d7bf5;
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
