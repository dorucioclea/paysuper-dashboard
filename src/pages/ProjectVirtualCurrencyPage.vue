<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { required, minValue, maxValue } from 'vuelidate/lib/validators';
import mergeApiValuesWithDefaults from '@/helpers/mergeApiValuesWithDefaults';
import PictureLetterGLandscape from '@/components/PictureLetterGLandscape.vue';
import ProjectEntityPricesForm from '@/components/ProjectEntityPricesForm.vue';
import TestingTag from '@/components/TestingTag.vue';
import updateLangFields from '@/helpers/updateLangFields';

const DEFAULTS = {
  logo: '',
  name: {
    en: '',
  },
  success_message: {
    en: '',
  },
  min_purchase_value: 0,
  max_purchase_value: 0,
  sell_count_type: 'fractional',
  prices: [],
};

export default {
  name: 'ProjectVirtualCurrencyPage',
  components: {
    PictureLetterGLandscape,
    ProjectEntityPricesForm,
    TestingTag,
  },

  data() {
    return {
      langFields: ['name', 'success_message'],
      virtualCurrency: null,
      valueSellMethodsList: [
        {
          label: 'Fractional value',
          value: 'fractional',
        },
        {
          label: 'Integral value',
          value: 'integral',
        },
      ],
    };
  },

  computed: {
    ...mapState('Project', ['project', 'defaultCurrency']),
    ...mapGetters('Project', ['currenciesTags', 'defaultCurrencyValue']),
    ...mapGetters('User', ['userPermissions']),

    viewOnly() {
      return !this.userPermissions.editProjects;
    },
  },

  validations() {
    const virtualCurrency = {
      name: {
        $each: {
          required,
        },
      },
      logo: {
        required,
      },
    };
    if (this.virtualCurrency.max_purchase_value) {
      virtualCurrency.min_purchase_value = {
        maxValue: maxValue(this.virtualCurrency.max_purchase_value),
      };
    }
    if (this.virtualCurrency.min_purchase_value) {
      virtualCurrency.max_purchase_value = {
        minValue: minValue(this.virtualCurrency.min_purchase_value),
      };
    }
    return {
      virtualCurrency,
    };
  },

  watch: {
    project() {
      this.updateVirtualCurrency();
    },
  },

  created() {
    this.updateVirtualCurrency();
  },

  methods: {
    ...mapActions(['uploadImage']),
    ...mapActions('Project', ['getRecommendedPrices']),

    updateVirtualCurrency() {
      this.virtualCurrency = mergeApiValuesWithDefaults(DEFAULTS, this.project.virtual_currency);
      updateLangFields(this.virtualCurrency, this.langFields, this.project.localizations);
    },

    handleSave() {
      this.$v.$touch();
      let isPricesValid = true;
      if (this.$refs.pricesBlock) {
        isPricesValid = this.$refs.pricesBlock.checkIsValid();
      }
      if (this.$v.$invalid || !isPricesValid) {
        this.$showErrorMessage('The form is not filled right');
        return;
      }
      this.$emit('save', {
        ...this.project,
        virtual_currency: this.virtualCurrency,
      });
    },
  },
};
</script>

<template>
<div>
  <UiPageHeaderFrame>
    <template slot="title">
      Virtual currency
      <TestingTag class="tag" v-if="false" />
    </template>
    <span slot="description">
      Virtual Currency is an option to sell your in-game currency — gold, coins, etc.
      This method allows you to sell customisable quantity of your currency.
      Integration webhook testing is obligatory requirement for this sales option.
    </span>
    <PictureLetterGLandscape slot="picture" />
  </UiPageHeaderFrame>

  <UiPanel>
    <section class="section">
      <UiImageUpload
        v-if="!viewOnly"
        class="section"
        title="logo"
        description="200x200 px, .png, .jpg"
        :uploadImage="uploadImage"
        v-model="virtualCurrency.logo"
      />
      <div
        class="logo-view-only"
        v-if="viewOnly && virtualCurrency.logo"
        :style="{backgroundImage: `url(${virtualCurrency.logo})`}">
      </div>
      <UiLangTextField
        label="Virtual currency name"
        :langs="project.localizations"
        :value="virtualCurrency.name"
        :disabled="viewOnly"
        v-bind="$getValidatedEachFieldProps(
        'virtualCurrency.name',
         Object.keys(virtualCurrency.name))"
      />
      <UiLangTextField
        label="Custom message on successful payment"
        :langs="project.localizations"
        :value="virtualCurrency.success_message"
        :disabled="viewOnly"
      />
    </section>

    <section class="section">
      <UiHeader
        :hasMargin="true"
        level="3"
      >
        Virtual currency single unit price
      </UiHeader>
      <p class="text">
        Setup the price for one virtual currency unit in all your <br> currencies.
        If you need to add more currencies to the list you can do this in
        <a :href="`/projects/${project.id}/settings/`">project settings</a>.
      </p>

      <ProjectEntityPricesForm
        ref="pricesBlock"
        :currencies="project.currencies"
        :getRecommendedPrices="getRecommendedPrices"
        :defaultCurrency="defaultCurrency"
        :disabled="viewOnly"
        v-model="virtualCurrency.prices"
      />
    </section>

    <section class="section">
      <p class="text">
        Choose maximal and minimal limits of virtual currency
        for a single purchase.
      </p>
      <UiTextField
        label="Minimum purchase value"
        v-model="virtualCurrency.min_purchase_value"
        v-bind="$getValidatedFieldProps('virtualCurrency.min_purchase_value')"
        :required="false"
        :isNumeric="true"
        :disabled="viewOnly"
      />
      <UiTextField
        label="Maximum purchase value"
        v-model="virtualCurrency.max_purchase_value"
        v-bind="$getValidatedFieldProps('virtualCurrency.max_purchase_value')"
        :required="false"
        :isNumeric="true"
        :disabled="viewOnly"
      />
    </section>

    <section class="section">
      <p class="text">
        Choose if your in-game currency may sell fractionally
        (for example: 1,58) or as an integral number (1, 2, 5 etc).
      </p>
      <div class="radio-group">
        <UiRadio
          class="radio"
          v-for="item in valueSellMethodsList"
          :key="item.value"
          :value="item.value"
          :disabled="viewOnly"
          v-model="virtualCurrency.sell_count_type"
        >
          {{ item.label }}
        </UiRadio>
      </div>
    </section>

    <div class="controls" v-if="!viewOnly">
      <UiButton
        :disabled="$v.virtualCurrency.$invalid"
        class="submit-button"
        @click="handleSave"
        text="SAVE"
      />
    </div>
  </UiPanel>
</div>
</template>

<style lang="scss" scoped>
.section {
  margin-bottom: 32px;
}

.text {
  width: 416px;
  margin-bottom: 12px;

  a {
    color: #3d7bf5;
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

.controls {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  width: 140px;
}

.tag {
  top: -8px;
  margin-left: 8px;
}

.logo-view-only {
  width: 64px;
  height: 64px;
  background-size: cover;
  background-repeat: no-repeat;
}
</style>
