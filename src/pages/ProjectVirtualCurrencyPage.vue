<script>
import { required } from 'vuelidate/lib/validators';
import PictureLetterGLandscape from '@/components/PictureLetterGLandscape.vue';

export default {
  name: 'ProjectVirtualCurrencyPage',
  components: {
    PictureLetterGLandscape,
  },
  props: {
    project: {
      type: Object,
      required: true,
    },
    uploadImage: {
      type: Function,
      required: true,
    },
  },

  data() {
    return {
      langs: ['en', 'ru'],
      currencies: ['USD', 'EUR'],
      image: '',
      virtualCurrencyName: {
        en: '',
        ru: '',
      },
      successfulMessage: {
        en: '',
        ru: '',
      },
      singleUnitPrice: {
        USD: 0,
        EUR: 0,
      },
    };
  },

  validations: {
    virtualCurrencyName: {
      en: {
        required,
      },
    },
  },

  methods: {
    handleSave() {
      this.$v.touch();
      if (this.$v.$invalid) {
        return;
      }
      this.$emit('save');
    },
  },
};
</script>

<template>
<div>
  <UiPageHeaderFrame tag="testing">
    <template slot="title">
      Virtual currency
      <span class="tag">
        Testing
        <IconParagraphPointer
          fill="#F3AA18"
          width="5"
          height="9"
        />
      </span>
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
        class="section"
        title="logo"
        description="200x200 px, .png, .jpg"
        :uploadImage="uploadImage"
        v-model="image"
      />
      <UiLangTextField
        :value="virtualCurrencyName"
        :langs="langs"
        label="Virtual currency name"
        v-bind="$getValidatedFieldProps('virtualCurrencyName.en')"
      />
      <UiLangTextField
        :value="successfulMessage"
        :langs="langs"
        label="Custom message on successful payment"
      />
    </section>

    <section class="section">
      <UiHeader
        :hasMargin="true"
        level="3"
      >
        Pricing
      </UiHeader>
      <p class="text">
        Setup the price for one virtual currency unit in all your <br> currencies.
        If you need to add more currencies to the list you can do this in
        <a :href="`/projects/${project.id}/settings/`">project settings</a>.
      </p>

      <div class="radio-group">
        <UiRadio class="radio" :disabled="true">
          Currency conversion
          <IconQuestion fill="#919699" />
        </UiRadio>
        <UiRadio class="radio">
          Manual input
          <IconQuestion fill="#919699" />
        </UiRadio>
        <UiRadio class="radio">
          Default currency only
          <IconQuestion fill="#919699" />
        </UiRadio>
      </div>
      <UiLangTextField
        :value="singleUnitPrice"
        :langs="currencies"
        :isMoney="true"
        :money="{ precision: 2 }"
        label="Virtual currency single unit price"
        v-bind="$getValidatedFieldProps('singleUnitPrice.USD')"
      />
    </section>

    <section class="section">
      <p class="text">
        Choose maximal and minimal limits of virtual currency
        for a single purchase.
      </p>
      <UiTextField
        :value="1"
        label="Minimum purchase value"
        :isMoney="true"
      />
      <UiTextField
        :value="100"
        label="Maximum purchase value"
        :isMoney="true"
      />
    </section>

    <section class="section">
      <p class="text">
        Choose if your in-game currency may sell fractionally
        (for example: 1,58) or as an integral number (1, 2, 5 etc).
      </p>
      <div class="radio-group">
        <UiRadio class="radio">Fractional value</UiRadio>
        <UiRadio class="radio">Integral value</UiRadio>
      </div>
    </section>

    <div class="controls">
      <UiButton
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
  position: relative;
  top: -8px;
  margin-left: 8px;
  height: 24px;
  line-height: 20px;
  border: 1px solid #f3aa18;
  box-sizing: border-box;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 12px;
  color: #f3aa18;
  letter-spacing: 0.4px;

  & > svg {
    margin-left: 4px;
  }
}
</style>