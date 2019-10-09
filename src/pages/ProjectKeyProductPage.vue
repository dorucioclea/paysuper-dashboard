<script>
import { mapState, mapActions, mapGetters } from 'vuex';
import { required } from 'vuelidate/lib/validators';
import { find, cloneDeep, debounce } from 'lodash-es';
import { OpenFileDialog } from '@/helpers/uploader';
import ProjectKeyProductStore from '@/store/ProjectKeyProductStore';
import ProjectKeyProductPriceBlock from '@/components/ProjectKeyProductPriceBlock.vue';

export default {
  name: 'ProjectKeyProductPage',

  components: {
    ProjectKeyProductPriceBlock,
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
      keyProductLocal: null,
      isSkuUnique: true,
      isDisablePlatformConfirmOpened: false,
      platformIdForDisable: '',
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
    ...mapState('Project', ['project']),
    ...mapGetters('Project', ['currenciesDetailed']),
    ...mapState('ProjectKeyProduct', ['keyProductId', 'keyProduct', 'platforms', 'keyCounts']),

    platformNameForDelete() {
      const platform = find(this.keyProductLocal.platforms, { id: this.platformIdForDisable });
      return platform ? platform.name : '';
    },
  },

  validations() {
    return {
      keyProductLocal: {
        name: {
          en: {
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
    };
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

  created() {
    this.updateKeyProductLocal();
  },

  methods: {
    ...mapActions(['setIsLoading', 'uploadImage']),
    ...mapActions('Project', ['checkIsSkuUnique']),
    ...mapActions('ProjectKeyProduct', [
      'initState', 'uploadKey', 'updateKeyProduct', 'createKeyProduct', 'getRecommendedPrices',
    ]),

    updateKeyProductLocal() {
      this.keyProductLocal = cloneDeep(this.keyProduct);

      this.keyProductLocal.platforms.forEach((platform) => {
        platform.prices = this.currenciesDetailed.map(({ currency, region }) => {
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
          prices: this.currenciesDetailed.map(item => ({
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
          this.$navigate(`/projects/${this.project.id}/game-keys/${this.keyProductId}`);
        }
      } catch (error) {
        this.$showErrorMessage(error);
      }
      this.setIsLoading(false);
    },

    async handleRecommendedPricesSelect({ amount, platformId, closeSuggest }, type) {
      this.setIsLoading(true);
      const prices = await this.getRecommendedPrices({ amount, type })
        .catch(this.$showErrorMessage);

      const platformData = find(this.keyProductLocal.platforms, { id: platformId });

      const defaultPrice = find(platformData.prices, { region: 'USD', currency: 'USD' });
      defaultPrice.amount = amount;

      prices.forEach((price) => {
        const item = find(platformData.prices, { region: price.region, currency: price.currency });
        if (item) {
          item.amount = price.amount;
        }
      });
      closeSuggest();
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
        class="localization-switch"
        v-model="keyProductLocal.cover.use_one_for_all"
      >
        Use single cover for all localizations
      </UiSwitchBox>

      <UiLangsImageUpload
        :uploadImage="uploadImage"
        :isLocalizationEnabled="!keyProductLocal.cover.use_one_for_all"
        v-model="keyProductLocal.cover.images"
      />

      <UiLangTextField
        label="Game title"
        v-model="keyProductLocal.name"
        v-bind="$getValidatedFieldProps('keyProductLocal.name.en')"
      />
      <UiTextField
        label="SKU"
        v-bind="$getValidatedFieldProps('keyProductLocal.sku')"
        v-model="keyProductLocal.sku"
        :disabled="keyProductId && !!keyProductLocal.sku"
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

      <ProjectKeyProductPriceBlock
        ref="pricesBlock"
        :platforms="keyProductLocal.platforms"
        :currencies="currenciesDetailed"
        @fillSteamPrices="handleRecommendedPricesSelect($event, 'steam')"
        @fillConvertedPrices="handleRecommendedPricesSelect($event, 'conversion')"
      />

    </section>
    <section class="section">
      <UiHeader level="3" :hasMargin="true">Keys</UiHeader>
      <UiText>
        Upload a pack of game keys for each DRM platform you selected before.
        Use CSV or TXT file format and a line break ("Enter" key) as a separator for key strings.
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
        title="keys"
      />
    </div>

    <div class="controls">
      <UiSwitchBox v-model="keyProductLocal.enabled">
        Enable package
      </UiSwitchBox>
      <UiButton
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