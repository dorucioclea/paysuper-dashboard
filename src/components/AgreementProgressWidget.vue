<script>
import { mapGetters, mapState } from 'vuex';
import { includes, reduce } from 'lodash-es';
import PictureWelcomeSheets from '@/components/PictureWelcomeSheets.vue';
import SmartListItem from '@/components/SmartListItem.vue';
import merchantStatusScheme from '@/schemes/merchantStatusScheme';

export default {
  name: 'AgreementProgressWidget',
  components: {
    PictureWelcomeSheets,
    SmartListItem,
  },
  data() {
    return {
      expandItems: {
        account: false,
        contacts: false,
        banking: false,
        tariff: false,
        license: false,
      },
    };
  },
  computed: {
    ...mapState('User/Merchant', [
      'onboardingCompleteStepsCount',
      'onboardingSteps',
      'merchant',
    ]),
    ...mapGetters('User/Merchant', ['hasProjects']),

    status() {
      return this.merchant.status;
    },
    statusValue() {
      return merchantStatusScheme[this.status].value;
    },
    isPending() {
      return this.statusValue === 'pending';
    },
    isSigning() {
      return this.statusValue === 'signing';
    },
    isSigned() {
      return this.statusValue === 'signed';
    },
    isCompanyInfoLocked() {
      return this.onboardingCompleteStepsCount > 2;
    },
    companyInfoStatuses() {
      return reduce(['company', 'contacts', 'banking'], (res, item) => ({
        ...res,
        [item]: {
          status: this.onboardingSteps[item]
            ? 'complete'
            : this.isCompanyInfoLocked ? 'locked' : 'default',
          notice: this.onboardingSteps[item] ? '' : 'Incomplete',
          noticeStatus: this.onboardingSteps[item] ? 'default' : 'warning',
        },
      }), {});
    },
    isPaymentMethodsLocked() {
      return this.onboardingCompleteStepsCount < 3 || this.status !== 0;
    },
    paymentMethodsStatus() {
      return {
        status: this.onboardingSteps.tariff
          ? 'complete'
          : this.isPaymentMethodsLocked ? 'locked' : 'default',
        notice: this.onboardingSteps.tariff
          ? ''
          : this.isPaymentMethodsLocked ? 'After Previous Steps' : 'Incomplete',
      };
    },
    isLicenseLocked() {
      return this.onboardingCompleteStepsCount < 4;
    },
    licenseNotice() {
      if (this.isLicenseLocked) {
        return 'After Previous Steps';
      }

      if (this.isPending) {
        return 'Checking…';
      }

      return this.isSigning ? 'Checking agreement…' : 'Not Signed';
    },
    licenseStatus() {
      if (this.isSigned) {
        return { status: 'complete', notice: '' };
      }

      const notice = this.licenseNotice;

      if (this.isLicenseLocked) {
        return { status: 'locked', notice };
      }

      return {
        status: this.isPending ? 'waiting' : 'default',
        notice,
      };
    },
    isProjectLocked() {
      return this.status < 4;
    },
    projectStatus() {
      return {
        status: this.hasProjects
          ? 'complete'
          : this.isProjectLocked ? 'locked' : 'default',
        notice: this.hasProjects
          ? ''
          : this.isProjectLocked ? 'After Previous Steps' : 'Incomplete',
      };
    },
    listItems() {
      return [
        {
          id: 'account',
          title: '1. Complete “Account Info” about your сompany in “Settings” section',
          performText: 'Provide your official and public company names as well as your official site WEB address, so we could understand your company is related to a video games industry.',
          ...this.companyInfoStatuses.company,
          page: 'company',
        },
        {
          id: 'contacts',
          title: '2. Complete “Contacts” about your company in “Settings” section',
          performText: 'Identify your company’s official representative person. He or she will be mentioned in legal documentation, signing documents, resolving banking and payment issues and will participate in possible disputes with your customers.',
          ...this.companyInfoStatuses.contacts,
          page: 'company',
        },
        {
          id: 'banking',
          title: '3. Complete “Banking Info” about your сompany in “Settings” section',
          performText: 'Enter your bank account details here to receive your payouts. First specify the SWIFT-code and we will fill-in your bank details automatically.',
          ...this.companyInfoStatuses.banking,
          page: 'company',
        },
        {
          id: 'tariff',
          title: '4. Complete “Payment Methods” in “Settings” section',
          performText: 'Choose payout currency and the main operational region, where you plan your main sales volume. This important choice will define your future money flow rates and commissions, so check the variants below carefully, since you will not be able to change these parameters in future.',
          ...this.paymentMethodsStatus,
          page: 'company',
        },
        {
          id: 'license',
          title: '5. Complete “License Agreement” in “Settings” section',
          performText: 'License Agreement signing procedure is initiated and document signing instructions are sent to your Company Representative’s e-mail. Please make sure this person received the e-mail and has authority to sign legal documentation. For e-signing we use “Hellosign” service, which provides legally binding electronic signatures.',
          ...this.licenseStatus,
          page: 'company',
        },
        {
          id: 'project',
          title: '6. Create a project in “Projects” section',
          performText: 'There is your full list of projects here. Setup every parameter, add products, proceed with technical S2S integration to activate every project sales.',
          ...this.projectStatus,
          page: 'ProjectsList',
        },
      ];
    },
  },
  methods: {
    toggle(event, index) {
      Object.keys(this.expandItems).forEach((i) => {
        if (this.expandItems[i]) {
          this.expandItems[i] = !this.expandItems[i];
        }
      });

      this.expandItems[index] = event;

      if (event) {
        this.$appEvents.$emit('updateContentScroll');
        this.$appEvents.$emit('contentScrollToY', 200);
      }
    },
    hasItemPerform(status) {
      return includes(['default', 'waiting'], status);
    },
  },
};
</script>

<template>
<div>
  <div class="welcome">
    <span class="welcome-icon">
      <PictureWelcomeSheets />
    </span>
    <div class="welcome-texts">
      <UiHeader class="title" level="3">Welcome to PaySuper!</UiHeader>
      <p>
        This short list of actions is all you need to start your successful sales.
        Our KYC procedure is short and we ask you to fill-in some organisational info,
        send us e-request for License Agreement e-signing and that’s all.
        Follow this step-by-step guide below and get your first payouts in a week.
      </p>
    </div>
  </div>
  <div
    v-for="(item, index) in listItems"
    :key="index"
    >
    <SmartListItem
      v-if="item.status !== 'complete'"
      class="item"
      v-bind="item"
      :expandable="true"
      :isExpanded="expandItems[item.id]"
      @toggle="toggle($event, item.id)"
    >
      <div v-if="hasItemPerform(item.status)">
        <div class="perform-text">
          {{ item.performText }}
        </div>
        <div class="perform-button">
          <RouterLink :to="{ name: `${item.page}`, params: { expandedItem: `${item.id}` }}" >
            <UiButton>
              PERFORM THIS STEP
            </UiButton>
          </RouterLink>
        </div>
      </div>
    </SmartListItem>
  </div>
</div>
</template>

<style lang="scss" scoped>
.welcome {
  display: flex;
  margin-bottom: 36px;
}
.welcome-texts {
  max-width: 566px;

  p {
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
    color: #5e6366;
  }
}
.welcome-icon {
  display: block;
  width: 212px;
  margin-right: 24px;
  padding-left: 27px;
  box-sizing: border-box;

  svg {
    vertical-align: top;
  }
}
.title {
  margin-bottom: 4px;
}
.item {
  margin-bottom: 8px;
}
.perform-text {
  color: #5e6366;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 8px;
}
.perform-button {
  margin-top: 18px;
}
</style>
