<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { required } from 'vuelidate/lib/validators';
import { find, cloneDeep, debounce } from 'lodash-es';
import { OpenFileDialog } from '@/helpers/uploader';
import ProjectKeyProductStore from '@/store/ProjectKeyProductStore';
import ProjectPlatformsPricesForm from '@/components/ProjectPlatformsPricesForm.vue';
import updateLangFields from '@/helpers/updateLangFields';

export default {
  name: 'ProjectKeyProductPage',

  components: {
    ProjectPlatformsPricesForm,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('ProjectKeyProduct', ProjectKeyProductStore, route.params.keyProductId);
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      langFields: ['cover.images', 'name'],
      keyProductLocal: null,
      isSkuUnique: true,
      isDisablePlatformConfirmOpened: false,
      platformIdForDisable: '',
      recommendedPricesTable: [],
      pricingList: [
        {
          id: 1,
          name: 'Auto-conversion from default currency',
        },
        {
          id: 2,
          name: 'Enter each price manually',
        },
        {
          id: 3,
          name: 'Use default currency only',
        },
        {
          id: 4,
          name: 'Steam recommended prices',
        },
      ],
    };
  },

  computed: {
    ...mapState('Project', ['project', 'defaultCurrency']),
    ...mapGetters('Project', ['defaultCurrencyValue']),
    ...mapState('ProjectKeyProduct', ['keyProductId', 'keyProduct', 'platforms', 'keyCounts']),
    ...mapGetters('User', ['userPermissions']),

    viewOnly() {
      return !this.userPermissions.editProjects;
    },

    platformNameForDelete() {
      const platform = find(this.keyProductLocal.platforms, { id: this.platformIdForDisable });
      return platform ? platform.name : '';
    },
  },

  validations: {
    keyProductLocal: {
      name: {
        $each: {
          required,
        },
      },
      description: {
        $each: {
          required,
        },
      },
      sku: {
        required,
        uniqueSku() {
          return this.isSkuUnique;
        },
      },
    },
  },

  async beforeRouteUpdate(to, from, next) {
    if (to.params.keyProductId !== from.params.keyProductId) {
      this.setIsLoading(true);
      await this.initState(to.params.keyProductId);
      this.updateKeyProductLocal();
      this.setIsLoading(false);
    }
    next();
  },

  async created() {
    this.updateKeyProductLocal();

    const { currency } = this.defaultCurrency;
    this.recommendedPricesTable = await this.getRecommendedPricesTable(currency)
      .catch(this.$showErrorMessage);
  },

  methods: {
    ...mapActions(['setIsLoading', 'uploadImage']),
    ...mapActions('Project', ['checkIsSkuUnique', 'getRecommendedPrices']),
    ...mapActions('ProjectKeyProduct', [
      'initState', 'uploadKey', 'updateKeyProduct', 'createKeyProduct', 'getRecommendedPricesTable',
    ]),

    updateKeyProductLocal() {
      this.keyProductLocal = {
        ...cloneDeep(this.keyProduct),
        default_currency: this.defaultCurrency.currency,
      };
      updateLangFields(this.keyProductLocal, this.langFields, this.project.localizations);

      this.keyProductLocal.platforms.forEach((platform) => {
        platform.prices = this.project.currencies.map(({ currency, region }) => {
          const match = find(platform.prices, { currency, region });
          return {
            currency,
            region,
            amount: match ? match.amount : '',
          };
        });
      });
    },

    handleUploadKey(platformId) {
      if (this.keyProductId === null) {
        return;
      }

      OpenFileDialog('text/*', async (file) => {
        this.setIsLoading(true);
        await this.uploadKey({
          platformId,
          file,
        }).catch(this.$showErrorMessage);
        this.setIsLoading(false);
      });
    },

    isPlatformEnabled(id) {
      if (this.platformIdForDisable === id) {
        // Necessary for correct UiSwith behavior if platform disable
        // is cancalled by the confirm
        return false;
      }
      return Boolean(find(this.keyProductLocal.platforms, { id }));
    },

    togglePlatform(id, isEnabled) {
      if (isEnabled) {
        const platform = find(this.platforms, { id });
        this.keyProductLocal.platforms.push({
          ...platform,
          prices: this.project.currencies.map(item => ({
            ...item,
            amount: '',
          })),
        });
      } else {
        this.isDisablePlatformConfirmOpened = true;
        this.platformIdForDisable = id;
      }
    },

    disablePlatform() {
      this.isDisablePlatformConfirmOpened = false;
      this.keyProductLocal.platforms = this.keyProductLocal.platforms.filter(
        platform => platform.id !== this.platformIdForDisable,
      );
      this.platformIdForDisable = '';
    },

    cancelPlatformDisable() {
      this.isDisablePlatformConfirmOpened = false;
      this.platformIdForDisable = '';
    },

    async handleKeyProductSave() {
      this.$v.$touch();
      let isPricesValid = true;
      if (this.$refs.pricesBlock) {
        isPricesValid = this.$refs.pricesBlock.checkIsValid();
      }
      if (this.$v.$invalid || !isPricesValid) {
        this.$showErrorMessage('The form is not filled right');
        return;
      }
      this.setIsLoading(true);
      try {
        if (this.keyProductId) {
          await this.updateKeyProduct(this.keyProductLocal);
          this.$showSuccessMessage('The key product is successfuly updated');
        } else {
          await this.createKeyProduct({
            keyProduct: this.keyProductLocal,
            projectId: this.project.id,
          });
          this.$showSuccessMessage('The key product is successfuly created');
        }
        this.$navigate(`/projects/${this.project.id}/game-keys/`);
      } catch (error) {
        this.$showErrorMessage(error);
      }
      this.setIsLoading(false);
    },

    handleSkuFieldInput: debounce(
      async function handleSkuFieldInput(value) {
        this.isSkuUnique = await this.checkIsSkuUnique(value).catch(this.$showErrorMessage);
        this.$v.keyProductLocal.sku.$touch();
      },
      200,
    ),
  },
};
</script>

<template>
<div>
  <UiPageHeaderFrame>
    <span slot="title">
      {{ keyProductId ? 'Editing' : 'Adding' }} key package
    </span>
    <span
      v-if="!keyProductId"
      slot="description"
    >
      Create a package to sell your game keys for associated DRM platforms.
      You can choose several platforms at once.
    </span>
  </UiPageHeaderFrame>

  <UiPanel>
    <section class="section">
      <UiSwitchBox
        :disabled="viewOnly"
        class="localization-switch"
        v-model="keyProductLocal.cover.use_one_for_all"
      >
        Use single cover for all localizations
      </UiSwitchBox>

      <UiLangsImageUpload
        :langs="project.localizations"
        :uploadImage="uploadImage"
        :isLocalizationEnabled="!keyProductLocal.cover.use_one_for_all"
        v-model="keyProductLocal.cover.images"
      />

      <UiLangTextField
        label="Game title"
        :langs="project.localizations"
        :disabled="viewOnly"
        v-model="keyProductLocal.name"
        v-bind="$getValidatedEachFieldProps(
        'keyProductLocal.name',
         Object.keys(keyProductLocal.name))"
      />
      <UiLangTextField
        label="Description"
        :langs="project.localizations"
        v-model="keyProductLocal.description"
        v-bind="$getValidatedEachFieldProps(
        'keyProductLocal.description',
         Object.keys(keyProductLocal.description))"
      />
      <UiTextField
        label="SKU"
        v-bind="$getValidatedFieldProps('keyProductLocal.sku')"
        v-model="keyProductLocal.sku"
        :disabled="(keyProductId && !!keyProductLocal.sku) || viewOnly"
        @input="handleSkuFieldInput"
      />
    </section>

    <section class="section">
      <UiHeader level="3" :hasMargin="true">DRM platforms</UiHeader>
      <UiText>
        Choose a set of DRM platforms you plan to use with this package.
        Each platform associated with it's own pack of keys.
      </UiText>
      <div
        class="platform-item"
        v-for="(platform, index) in platforms"
        :key="index"
      >
        <UiSwitchBox
          :disabled="viewOnly"
          :checked="isPlatformEnabled(platform.id)"
          @change="togglePlatform(platform.id, $event)"
        >
          {{ platform.name }}
        </UiSwitchBox>
      </div>
    </section>

    <section class="section" v-if="keyProductLocal.platforms.length">
      <UiHeader level="3" :hasMargin="true">Package price</UiHeader>
      <UiText>
        Setup the price for every platform in all your currencies.
        If you need to add more currencies to the list you can do this in
        <RouterLink :to="`/projects/${project.id}/settings/`">project settings</RouterLink>.
      </UiText>

      <ProjectPlatformsPricesForm
        ref="pricesBlock"
        v-model="keyProductLocal.platforms"
        :currencies="project.currencies"
        :getRecommendedPrices="getRecommendedPrices"
        :defaultCurrency="defaultCurrency"
        :recommendedPricesTable="recommendedPricesTable"
        :disabled="viewOnly"
      />

    </section>
    <section class="section">
      <UiHeader level="3" :hasMargin="true">Keys</UiHeader>
      <UiText>
        Upload a pack of game keys for each DRM platform you selected before.
        Use CSV or TXT file format and a line break ("Enter" key) as a separator for key strings.
      </UiText>
      <UiText v-if="keyProductId === null">
        First you need to <strong>save the package</strong> and then upload key files for platforms.
      </UiText>
    </section>

    <div
      class="key-item"
      v-for="platform in keyProductLocal.platforms"
      :key="platform.id"
      :class="{ '_empty': !keyCounts[platform.id] }"
      @click="handleUploadKey(platform.id)"
    >
      <span>{{ platform.name }} — {{ keyCounts[platform.id] || 'no' }} keys</span>
      <UiUploadControls
        v-if="!viewOnly"
        :disabled="keyProductId === null"
        :isFilled="keyCounts[platform.id]"
        title="keys"
      />
    </div>

    <div class="controls" v-if="!viewOnly">
      <UiSwitchBox v-model="keyProductLocal.enabled">
        Enable package
      </UiSwitchBox>
      <UiButton
        :disabled="$v.keyProductLocal.$invalid"
        class="submit-button"
        text="SAVE"
        @click="handleKeyProductSave"
      />
    </div>
  </UiPanel>

  <UiDeleteModal
    v-if="isDisablePlatformConfirmOpened"
    title="Disable platform"
    closeButtonText="Cancel"
    submitButtonText="Disable"
    @close="cancelPlatformDisable"
    @submit="disablePlatform"
  >
    Are you sure you want to disable <br>{{platformNameForDelete}}?
  </UiDeleteModal>
</div>
</template>

<style lang="scss" scoped>
.localization-switch {
  margin-bottom: 20px;
}
.section {
  margin-bottom: 24px;
}
.platform-item {
  height: 56px;
  display: flex;
  align-items: center;

  & + & {
    border-top: 1px solid #e3e5e6;
  }
}

.key-item {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #000000;
  cursor: pointer;

  &._empty {
    color: #919699;
  }

  & + & {
    border-top: 1px solid #e3e5e6;
  }
}

.controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
}

.submit-button {
  width: 140px;
  margin-left: 32px;
}
</style>
