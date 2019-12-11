<script>
import { find, mapValues, isEqual } from 'lodash-es';
import { required } from 'vuelidate/lib/validators';
import { mapActions } from 'vuex';
import PriceSuggestTable from '@/components/PriceSuggestTable.vue';

export default {
  name: 'ProjectEntityPricesForm',

  components: {
    PriceSuggestTable,
  },

  props: {
    prices: {
      type: Array,
      required: true,
    },
    currencies: {
      type: Array,
      required: true,
    },
    getRecommendedPrices: {
      type: Function,
      required: true,
    },
    defaultCurrency: {
      type: Object,
      required: true,
    },

    // Those two below are used at Key products (game keys)
    hasSteamRecommendations: {
      type: Boolean,
      default: false,
    },
    recommendedPricesTable: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  model: {
    prop: 'prices',
    event: 'updatePrice',
  },

  data() {
    return {
      priceData: null,
      isSteamSuggestOpened: false,
    };
  },

  computed: {
    regionsPriceData() {
      return this.priceData.filter(item => item.currency !== item.region);
    },

    priceSuggestList() {
      const result = [
        {
          id: 'manual',
          text: 'Continue manual input for all currencies',
        },
        {
          id: 'conversion',
          text: 'Use auto-conversion from default currency',
        },
      ];
      if (!this.hasSteamRecommendations) {
        return result;
      }
      return [
        ...result,
        {
          id: 'steam',
          text: 'Select Steam recommended prices',
        },
      ];
    },
  },

  watch: {
    prices: {
      handler(value) {
        this.priceData = this.currencies.map(({ currency, region }) => {
          const match = find(value, { currency, region });
          if (match) {
            return match;
          }
          return {
            amount: null,
            currency,
            region,
          };
        });
      },
      immediate: true,
    },
  },

  validations() {
    return {
      priceData: mapValues(this.priceData, () => ({
        amount: {
          required,
        },
      })),
    };
  },

  methods: {
    ...mapActions(['setIsLoading']),

    updatePrice() {
      this.$emit('updatePrice', this.priceData);
    },

    getCurrencyName({ currency, region }) {
      if (this.isDefault({ currency, region })) {
        return `${currency}, Default currency`;
      }
      if (currency === region) {
        return currency;
      }
      return `${region}, ${currency}`;
    },

    isDefault({ currency, region }) {
      return isEqual(this.defaultCurrency, { currency, region });
    },

    async fillPrice(amount, type) {
      this.setIsLoading(true);
      const { currency } = this.defaultCurrency;
      try {
        const prices = await this.getRecommendedPrices({ type, amount, currency });
        prices.forEach((price) => {
          const item = find(this.priceData, { region: price.region, currency: price.currency });
          if (item) {
            item.amount = price.amount;
          }
        });
        this.updatePrice();
      } catch (error) {
        this.$showErrorMessage(error);
      }
      this.setIsLoading(false);
    },

    async handleSuggestClick(item, closeSuggest) {
      if (item.id === 'steam') {
        this.isSteamSuggestOpened = true;
        return;
      }
      const defaultCurrencyAmount = find(this.priceData, price => this.isDefault(price)).amount;
      if (item.id === 'conversion' && defaultCurrencyAmount > 0) {
        await this.fillPrice(defaultCurrencyAmount, 'conversion');
      }
      closeSuggest();
    },

    async handleSteamPriceSelect(amount, closeSuggest) {
      await this.fillPrice(amount, 'steam');
      closeSuggest();
    },

    checkIsValid() {
      this.$v.$touch();
      return !this.$v.$invalid;
    },
  },
};
</script>

<template>
<div>
  <div class="price-group">
    <UiTextField
      v-for="(price, index) in priceData"
      :key="index"
      :class="['price-input', { '_default': isDefault(price) }]"
      :isNumeric="true"
      :decimalLength="2"
      :label="getCurrencyName(price, index)"
      :disabled="disabled"
      v-model="price.amount"
      v-show="price.region === price.currency"
      v-bind="$getValidatedFieldProps(`priceData[${index}].amount`)"
      @suggestClosed="isSteamSuggestOpened = false"
      @input="updatePrice"
    >
      <template v-slot:suggest="{ closeSuggest }" v-if="isDefault(price)">
        <div>
          <PriceSuggestTable
            v-show="isSteamSuggestOpened"
            :items="recommendedPricesTable"
            @close="closeSuggest"
            @select="handleSteamPriceSelect($event, closeSuggest)"
          />
          <UiSuggestItem
            v-show="!isSteamSuggestOpened"
            v-for="(item, index) in priceSuggestList"
            :key="index"
            v-text="item.text"
            @click.stop="handleSuggestClick(item, closeSuggest)"
          />
        </div>
      </template>
    </UiTextField>
  </div>

  <!-- Show prices for regions if available -->
  <div class="region-prices" v-if="regionsPriceData.length">
    <UiHeader level="4" :hasMargin="true">Prices for regions</UiHeader>
    <div class="price-group">
      <UiTextField
        class="price-input"
        v-for="(price, index) in regionsPriceData"
        :key="index"
        :isNumeric="true"
        :decimalLength="2"
        :disabled="disabled"
        v-model="price.amount"
        v-bind="$getValidatedFieldProps(`priceData[${index}].amount`)"
        @input="updatePrice"
      >
        <span slot="label">
          <IconQuestionInCircle class="field-label-icon" />
          {{ getCurrencyName(price, index) }}
        </span>
      </UiTextField>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
.price-group {
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.price-input {
  width: 18%;
  margin-right: 2%;

  &:first-child {
    width: 100%;
  }
}
.field-label-icon {
  position: absolute;
  margin: 1px 0 0 -16px;
  cursor: pointer;
}
</style>
