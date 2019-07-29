<script>
import { mapGetters } from 'vuex';
import { required } from 'vuelidate/lib/validators';

export default {
  name: 'AccountInfo',
  data() {
    return {
      legalName: '',
      website: '',
      operatingName: '',
      country: '',
      region: '',
      city: '',
      zip: '',
      address1: '',
      address2: '',
    };
  },
  validations: {
    legalName: { required },
    website: { required },
    country: { required },
    zip: { required },
    city: { required },
    address1: { required },
  },
  computed: {
    ...mapGetters('Dictionaries', ['countries']),
    // Stub for cities
    cities() {
      return [
        { label: 'Moscow', value: 'moscow' },
        { label: 'Novosibirsk', value: 'novosibirsk' },
        { label: 'Samara', value: 'samara' },
        { label: 'Omsk', value: 'omsk' },
        { label: 'Vladivostok', value: 'vladivostok' },
        { label: 'Chelyabinsk', value: 'chelyabinsk' },
      ];
    },
  },
  methods: {
    submit() {
      this.$v.$touch();
      if (!this.$v.$invalid) {
        this.$emit('accountInfoSubmit');
      }
    },
  },
};
</script>

<template>
<div class="account-info">
  <div class="section">
    <div class="title">Identification</div>
    <div class="info">
      Provide your official and public company names as well as your official site WEB address,
      so we could understand your company is related to a video games industry.
    </div>

    <UiTextField
      v-bind="$getValidatedFieldProps('legalName')"
      label="Legal name"
      :value="legalName"
      @input="legalName = $event"
      @blur="$v.legalName.$touch()"
    />
    <UiTextField
      v-bind="$getValidatedFieldProps('website')"
      label="Website"
      :value="website"
      @input="website = $event"
      @blur="$v.website.$touch()"
    />
    <UiTextField
      label="Operating name"
      :value="operatingName"
      @input="operatingName = $event"
    />
  </div>

  <div class="section">
    <div class="title">Location</div>
    <div class="info">
      Notice your company correct location address here.
      Since this information will be mentioned in official documentation between us
      it must be corresponded with your official registrational data.
    </div>

    <UiSelect
      v-bind="$getValidatedFieldProps('country')"
      label="Country"
      :options="countries"
      :value="country"
      @input="country = $event"
      @blur="$v.country.$touch()"
    />
    <UiTextField
      label="State / Province / Region"
      :value="region"
      @input="region = $event"
    />
    <UiSelect
      v-bind="$getValidatedFieldProps('city')"
      label="City"
      :options="cities"
      :value="city"
      @input="city = $event"
      @blur="$v.city.$touch()"
    />
    <UiTextField
      v-bind="$getValidatedFieldProps('zip')"
      label="Zip Code"
      :value="zip"
      @input="zip = $event"
      @blur="$v.zip.$touch()"
    />
    <UiTextField
      v-bind="$getValidatedFieldProps('address1')"
      label="Address 1"
      :value="address1"
      @input="address1 = $event"
      @blur="$v.address1.$touch()"
    />
    <UiTextField
      label="Address 2"
      :value="address2"
      @input="address2 = $event"
    />
  </div>

  <UiButton
    class="submit"
    :disabled="$v.$invalid"
    @click="submit"
  >
    SUBMIT INFO
  </UiButton>
</div>
</template>

<style lang="scss" scoped>
.account-info {
  display: flex;
  flex-direction: column;
}
.section {
  margin-bottom: 12px;
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
  max-width: 548px;
}
.submit {
  width: 180px;
  align-self: flex-end;
}
</style>