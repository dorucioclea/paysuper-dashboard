<script>
import { mapState } from 'vuex';
import { get } from 'lodash-es';
import PictureDwellingHouse from '@/components/PictureDwellingHouse.vue';

export default {
  name: 'MerchantAdminCompanyInfoPage',

  components: {
    PictureDwellingHouse,
  },

  computed: {
    ...mapState('Merchant', ['merchant']),

    countryText() {
      const country = get(this.merchant, 'company.country');
      if (!country) {
        return '';
      }
      return this.$t(`countries.${country}`);
    },
  },

  methods: {
    get,
    getWebsiteValue(value) {
      if (!value) {
        return '';
      }
      return `<a target="_blank" href="${value}">${value}</a>`;
    },
    getEmailValue(value) {
      if (!value) {
        return '';
      }
      return `<a href="mailto:${value}">${value}</a>`;
    },
  },
};
</script>

<template>
<div>
  <UiPageHeaderFrame>
    <span slot="title">Company Info</span>
    <span slot="description">
      Reference information about merchant's company. We need it
      to build connections with merchant and also it will be mentioned
      in business documentation.
    </span>
    <PictureDwellingHouse slot="picture" />
  </UiPageHeaderFrame>

  <UiPanel>
    <section class="section">
      <UiHeader level="3" :hasMargin="true">Identification</UiHeader>
      <div class="columns">
        <UiTextFieldReadonly
          label="Legal name"
          :value="get(merchant, 'company.name')"
        />
        <UiTextFieldReadonly
          label="Operating name"
          :value="get(merchant, 'company.alternative_name')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="Website"
          :value="getWebsiteValue(get(merchant, 'company.website'))"
        />
      </div>
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">Location</UiHeader>
      <div class="columns">
        <UiTextFieldReadonly
          label="Country"
          :value="countryText"
        />
        <UiTextFieldReadonly
          label="Zip сode"
          :value="get(merchant, 'company.zip')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="State/ province/ region"
          :value="get(merchant, 'company.state')"
        />
        <UiTextFieldReadonly
          label="Address 1"
          :value="get(merchant, 'company.address')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="City"
          :value="get(merchant, 'company.city')"
        />
        <UiTextFieldReadonly
          label="Address 2"
          :value="get(merchant, 'company.address_additional')"
        />
      </div>
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">Company representative</UiHeader>
      <div class="columns">
        <UiTextFieldReadonly
          label="Name"
          :value="get(merchant, 'contacts.authorized.name')"
        />
        <UiTextFieldReadonly
          label="Phone"
          :value="get(merchant, 'contacts.authorized.phone')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="Email"
          :value="getEmailValue(get(merchant, 'contacts.authorized.email'))"
        />
        <UiTextFieldReadonly
          label="Position"
          :value="get(merchant, 'contacts.authorized.position')"
        />
      </div>
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">Technical specialist</UiHeader>
      <div class="columns">
        <UiTextFieldReadonly
          label="Name"
          :value="get(merchant, 'contacts.technical.name')"
        />
        <UiTextFieldReadonly
          label="Phone"
          :value="get(merchant, 'contacts.technical.phone')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="Email"
          :value="getEmailValue(get(merchant, 'contacts.technical.email'))"
        />
      </div>
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">Account details</UiHeader>
      <div class="columns">
        <UiTextFieldReadonly
          label="SWIFT"
          :value="get(merchant, 'banking.swift')"
        />
        <UiTextFieldReadonly
          label="Beneficiary’s bank name"
          :value="get(merchant, 'banking.name')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="Account currency"
          :value="get(merchant, 'banking.currency')"
        />
        <UiTextFieldReadonly
          label="Beneficiary’s bank address"
          :value="get(merchant, 'banking.address')"
        />
      </div>
      <div class="columns">
        <UiTextFieldReadonly
          label="Beneficiary’s bank account"
          :value="get(merchant, 'banking.account_number')"
        />
        <UiTextFieldReadonly
          label="Correspondent bank account"
          :value="get(merchant, 'banking.correspondent_account')"
        />
      </div>
    </section>

  </UiPanel>
</div>
</template>

<style lang="scss" scoped>
.columns {
  display: flex;

  & > * {
    width: 50%;
  }
}

.section {
  padding-bottom: 20px;

  & + & {
    border-top: 1px solid #e3e5e6;
    padding-top: 32px;
  }
}
</style>
