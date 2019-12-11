<script>
import moment from 'moment';
import { find, get } from 'lodash-es';
import { mapState, mapActions, mapGetters } from 'vuex';
import { maxLength, required } from 'vuelidate/lib/validators';
import PaymentLinkCardStore from '@/store/PaymentLinkCardStore';
import PaymentLinkChartsStore from '@/store/PaymentLinkChartsStore';
import SelectProductsModal from '@/components/SelectProductsModal.vue';
import UiTextFieldReadonly from '@/components/UiTextFieldReadonly.vue';
import copyTextToClipboard from '@/helpers/copyTextToClipboard';
import PaymentLinkCharts from '@/components/PaymentLinkCharts.vue';

const STATUS_COLOR = {
  false: 'green',
  true: 'transparent',
};

const STATUS = {
  false: 'Active',
  true: 'Expired',
};

export default {
  name: 'PaymentLinksCard',
  validations: {
    createLink: {
      name: { maxLength: maxLength(256), required },
      dateInput: { maxLength: maxLength(60), required },
    },
  },
  components: {
    UiTextFieldReadonly,
    SelectProductsModal,
    PaymentLinkCharts,
  },
  data() {
    return {
      createLink: {
        name: '',
        dateInput: Number((new Date().getTime() / 1000).toFixed(0)),
        projectId: null,
        productsType: null,
      },
      noExpirationDate: false,
      isSelectProductsModalOpened: false,
      isDeleteModalOpened: false,
      productIdForAction: null,
      productsItems: [],
      productsItemsSelected: [],
      productsTypes: [
        {
          label: 'Virtual items',
          value: 'product',
        },
        {
          label: 'Game keys',
          value: 'key',
        },
      ],
      selectProductsType: 'product',
      colors: STATUS_COLOR,
      tabs: [
        { label: 'Dashboard', value: '0' },
        { label: 'Settings', value: '1' },
      ],
      currentTab: 0,
    };
  },

  watch: {
    selectProductsType() {
      this.productsItemsSelected = [];
    },
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('PaymentLink', PaymentLinkCardStore, {
        linkId: route.params.linkId,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }

    try {
      await registerStoreModule('PaymentLinkCharts', PaymentLinkChartsStore, {
        query: route.query,
        linkId: route.params.linkId,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  computed: {
    ...mapGetters('Dictionaries', ['countries']),
    ...mapState('User/Merchant', ['merchant']),
    ...mapState('PaymentLink', [
      'productsList',
      'projectsList',
      'linkItem',
      'linkItemUrl',
      'currency',
    ]),

    productsItemsOptions() {
      return this.productsList.items.map(item => ({ label: item.name.en, value: item.id }));
    },

    projectsOptions() {
      return this.projectsList.items.map(item => ({ label: item.name.en, value: item.id }));
    },

    productsListModal() {
      return this.productsList.items.slice();
    },

    isCreate() {
      let date = false;

      if (!this.noExpirationDate) {
        date = this.createLink.dateInput !== '';
      } else {
        date = true;
      }

      return this.createLink.name !== ''
          && date
          && this.productsItems.length > 0;
    },

    isNewItem() {
      return this.$route.params.linkId === 'new';
    },

    contactsName() {
      return get(this.merchant, 'contacts.authorized.name') || '';
    },
  },

  methods: {
    ...mapActions('PaymentLink', ['fetchProducts', 'createItem', 'editItem']),
    ...mapActions(['setIsLoading']),

    handleSetDate(value) {
      this.createLink.dateInput = value;
    },

    requestDeleteProductModal(index) {
      this.productIdForAction = index;
      this.isSelectProductsModalOpened = false;
      this.isDeleteModalOpened = true;
    },

    handleModalSave() {
      this.productsItems = this.productsItemsSelected;
      this.isSelectProductsModalOpened = false;
    },

    updateSelectProducts(value) {
      this.productsItemsSelected = value;
    },

    async openSelectProductsModal() {
      const type = this.selectProductsType === 'key' ? 'key-products' : 'products';
      await this.fetchProducts({
        projectId: this.createLink.projectId,
        type,
      });
      this.isSelectProductsModalOpened = true;
    },

    deleteProductInList() {
      this.productsItems.splice(this.productIdForAction, 1);
      this.isDeleteModalOpened = false;
    },

    getItemPrice(item) {
      if (item.billing_type === 'virtual') {
        const price = find(item.prices, { is_virtual_currency: true });
        if (!price) {
          return '';
        }
        return `VC ${price.amount}`;
      }

      const price = find(item.prices, this.defaultCurrency);
      if (!price) {
        return '';
      }
      return this.$formatPrice(price.amount, price.currency);
    },

    getPlatformPrice(platform) {
      const price = find(platform.prices, this.defaultCurrency);
      if (!price) {
        return '';
      }
      return this.$formatPrice(price.amount, price.currency);
    },

    async create() {
      this.$v.$touch();
      if (this.$v.$invalid) {
        this.$showErrorMessage('The link is not created');
        return;
      }
      const products = this.productsItems.map(item => (item.id));
      this.setIsLoading(true);
      const data = {
        products,
        expires_at: this.createLink.dateInput,
        project_id: this.createLink.projectId,
        name: this.createLink.name,
        no_expiry_date: this.noExpirationDate,
        products_type: this.selectProductsType,
      };
      try {
        if (this.isNewItem) {
          await this.createItem(data);
          this.$showSuccessMessage('The link is created successfully');
        } else {
          await this.editItem(data);
          this.$showSuccessMessage('The link is edited successfully');
        }
        this.$navigate('/payment-links/');
      } catch (e) {
        this.$showErrorMessage(e);
      }
      this.setIsLoading(false);
    },

    updateSelectProductsType(value) {
      const type = value === 'key' ? 'key-products' : 'products';
      this.selectProductsType = value;

      this.fetchProducts({
        projectId: this.createLink.projectId,
        type,
      });
    },

    formatDate(date) {
      return moment.unix(date).format('D MMM YYYY,');
    },

    getStatus(status) {
      return STATUS[status];
    },

    copyToClipboard(value) {
      copyTextToClipboard(value);
    },

    getCountryByCode(code) {
      return get(find(this.countries, ({ value }) => value === code), 'label', code);
    },
  },

  mounted() {
    if (!this.isNewItem) {
      this.productsItems = this.productsList;
      this.createLink.name = this.linkItem.name;
      this.noExpirationDate = this.linkItem.no_expiry_date;
      this.createLink.projectId = this.linkItem.project_id;
      this.selectProductsType = this.linkItem.products_type;
    }
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame>
      <template slot="title">
        {{ isNewItem ? 'Link creating' : `Link ID ${linkItem.id}` }}
      </template>
      <template slot="description" v-if="!isNewItem">
        {{ formatDate(linkItem.created_at.seconds) }}
        {{ contactsName }}
        <div class="status-block">
          <UiLabelTag class="status" :color="colors[linkItem.is_expired]">
            {{ getStatus(linkItem.is_expired) }}
          </UiLabelTag>
        </div>
      </template>
    </UiPageHeaderFrame>
    <UiPanel v-if="!isNewItem && linkItemUrl">
      <section class="section">
        <div class="link-url-block">
          <UiTextFieldReadonly
            v-model="linkItemUrl"
            label="Payment link"
            disabled
          />
          <button class="button-copy"
            @click="copyToClipboard(linkItemUrl)"
          >
            <IconCopy />
            <span class="button-copy__text">
              COPY
            </span>
          </button>
        </div>
      </section>
    </UiPanel>
    <UiPanel>
      <div class="panel-header" v-if="!isNewItem">
        <div class="panel-header__col">
          <UiTabs
            class="tabs"
            :items="tabs"
            v-model="currentTab">
          </UiTabs>
        </div>
      </div>

      <template v-if="!isNewItem && currentTab === 0">
        <div class="total-summary">
          <div class="total-summary__col">
            <span>
              {{
                linkItem.gross_total_amount !== null && linkItem.gross_total_amount !== 0
                  ? $formatPrice(linkItem.gross_total_amount, currency)
                  : $formatPrice('0', currency)
               }}
            </span>
            <span>Gross revenue</span>
          </div>
          <div class="total-summary__col">
            <span>
              {{
                 linkItem.conversion !== null
                  ? linkItem.conversion
                  : 0
              }}
            </span>
            <span>Conversion</span>
          </div>
          <div class="total-summary__col">
            <span>
              {{
                linkItem.total_transactions !== null
                  ? linkItem.total_transactions
                  : 0
              }}
            </span>
            <span>Payments</span>
          </div>
          <div class="total-summary__col">
            <span>
              {{
                linkItem.visits !== null
                  ? linkItem.visits
                  : 0
              }}
            </span>
            <span>Total clicks</span>
          </div>
        </div>
        <div>
          <PaymentLinkCharts v-if="!isNewItem" />
        </div>
      </template>

      <template v-if="isNewItem || currentTab === 1">
        <section class="section">
          <UiHeader level="3" :hasMargin="true">
            {{ isNewItem ? 'Initial details' : `Details` }}
          </UiHeader>
          <UiTextField
            v-bind="$getValidatedFieldProps('createLink.name')"
            label="Name"
            :value="createLink.name"
            v-model="createLink.name"
            @blur="$v.createLink.name.$touch()"
          />
          <UiDate
            v-bind="$getValidatedFieldProps('createLink.dateInput')"
            class="expiration-date"
            :value="createLink.dateInput"
            label="Expiration date"
            :required="true"
            v-model="createLink.dateInput"
            @input="handleSetDate"
            :disabled="noExpirationDate"
          />
          <UiSwitchBox v-model="noExpirationDate">
            No expiration date
          </UiSwitchBox>
          <UiSelect
            v-bind="$getValidatedFieldProps('createLink.project_id')"
            label="Project"
            class="select-project"
            :options="projectsOptions"
            :value="createLink.projectId"
            v-model="createLink.projectId"
            :disabled="!isNewItem"
          />
        </section>
        <section class="section" v-if="createLink.projectId !== null">
          <UiHeader class="section__header" level="3" :hasMargin="true">
            Products
          </UiHeader>
          <div class="section__info">
            Select a set of <b>max. 8 products</b> of the same type you want
            <div>to add to a current payment link.</div>
          </div>
          <div class="controls">
            <UiButton
              :disabled="!(productsItems.length <= 8)"
              class="create-products"
              @click="openSelectProductsModal"
              color="transparent-blue-thin-border"
              :isTransparent="true"
            >
              <IconPlus slot="iconBefore" />
              SELECT PRODUCTS
            </UiButton>
          </div>
        </section>
        <section v-if="createLink.projectId !== null">
          <div class="items-list">
            <UiTable>
              <UiTableRow :isHead="true">
                <UiTableCell width="40px" align="center"></UiTableCell>
                <UiTableCell width="350px" align="left">Name</UiTableCell>
                <UiTableCell width="350px" align="left">SKU</UiTableCell>
                <UiTableCell width="200px" align="left"
                  v-if="selectProductsType === 'key'"
                ></UiTableCell>
                <UiTableCell width="200px" align="left">Price</UiTableCell>
                <UiTableCell width="3%" align="left"></UiTableCell>
              </UiTableRow>
              <template v-if="productsItems.length">
                <UiTableRow
                  class="content-row"
                  v-for="(item, index) in productsItems"
                  :key="item.id"
                  :index="index"
                >
                  <UiTableCell width="40px" align="center" valign="middle"
                    v-if="item.object === 'product'"
                  >
                    <div
                      v-if="item.images !== null"
                      :style="{ backgroundImage: `url(${item.images[0]})` }"
                      class="item-image">
                    </div>
                  </UiTableCell>
                  <UiTableCell width="40px" align="center" valign="middle"
                    v-if="item.object === 'key_product'"
                  >
                    <span
                      v-if="item.cover && item.cover.images.en"
                      class="img"
                      :style="{ backgroundImage: `url(${item.cover.images.en})` }"
                    ></span>
                    <IconNoImage
                      v-else
                      class="item-image"
                      width="18"
                      height="18"
                      fill="#919699"
                    />
                  </UiTableCell>
                  <UiTableCell width="200px" align="left" valign="middle" :title="item.name.en">
                    <span class="cell-text vi-name">
                      {{ item.name.en }}
                    </span>
                  </UiTableCell>
                  <UiTableCell width="200px" align="left" valign="middle" :title="item.sku">
                    <span class="cell-text vi-name">
                      {{ item.sku }}
                    </span>
                  </UiTableCell>
                  <UiTableCell align="left"  valign="middle"
                     v-if="item.object === 'key_product'"
                   >
                    <UiTableCellUnit
                      v-for="platform in item.platforms"
                      :key="platform.id"
                    >
                      {{ platform.name }}
                    </UiTableCellUnit>
                    <UiNoText v-if="!item.platforms" />
                  </UiTableCell>
                  <UiTableCell class="cell-price" width="110px" align="left" valign="middle"
                    v-if="item.object === 'product'"
                    :title="getItemPrice(item)"
                    >
                    <UiNoText v-if="!getItemPrice(item)" />
                    <span v-else class="cell-price">
                      {{ getItemPrice(item) }}
                    </span>
                  </UiTableCell>
                  <UiTableCell align="left" valign="middle"
                    v-if="item.object === 'key_product'"
                  >
                  <UiTableCellUnit
                     v-for="platform in item.platforms"
                     :key="platform.id"
                  >
                     <UiNoText v-if="!getPlatformPrice(platform)" />
                     <span v-els class="cell-price">
                       {{ getPlatformPrice(platform) }}
                     </span>
                    </UiTableCellUnit>
                    <UiNoText v-if="!item.platforms" />
                  </UiTableCell>
                  <UiTableCell width="40px" align="center" valign="middle">
                    <span class="delete" @click="requestDeleteProductModal(index)">
                      <IconDelete/>
                    </span>
                  </UiTableCell>
                </UiTableRow>
              </template>
            </UiTable>
            <div class="no-products"  v-if="productsItems.length === 0">
              You don’t have any item yet
            </div>
          </div>
        </section>

        <div class="create">
          <UiButton
            :disabled="!isCreate"
            @click="create"
          >
            {{ isNewItem ? 'CREATE' : 'SAVE' }}
          </UiButton>
        </div>
      </template>

    </UiPanel>

    <UiDeleteModal
      v-if="isDeleteModalOpened"
      title="Delete product"
      closeButtonText="Cancel"
      @close="isDeleteModalOpened = false"
      @submit="deleteProductInList"
    >
      Are you sure you want to delete the product from this payment link set?
    </UiDeleteModal>

    <SelectProductsModal
      v-if="isSelectProductsModalOpened"
      v-model="productsItemsSelected"
      :title="`Selected ${productsItemsSelected.length} of 8 products`"
      :value="productsItemsSelected"
      :items="productsListModal"
      :options="productsItemsOptions"
      @close="isSelectProductsModalOpened = false"
      @save="handleModalSave"
      @updated="updateSelectProducts"
    >
      <div class="radio-group">
        <UiRadio
          class="radio"
          v-for="item in productsTypes"
          :checked="item.value === selectProductsType"
          :disabled="linkItem.products_type && linkItem.products_type !== item.value"
          :key="item.value"
          :value="item.value"
          @change="updateSelectProductsType($event)"
        >
          {{ item.label }}
        </UiRadio>
      </div>
    </SelectProductsModal>
  </div>
</template>

<style lang="scss" scoped>
  .control-bar {
    display: flex;
    justify-content: space-between;
  }
  .expiration-date {
    width: 360px;
    &.ui-filter-date {
      max-width: 360px;
    }
    /deep/ .mx-input {
      border: none;
      border-bottom: 1px solid #E3E5E6;
    }
  }
  .section {
    &__header {
      margin-top: 32px;
    }
    &__info {
      width: 420px;
      b {
        font-weight: 500;
      }
    }
  }
  .controls {
    margin: 28px 0;
  }
  .create-products {
    border: 1px solid #367BF5;
  }
  .no-products {
    width: 100%;
    font-size: 12px;
    line-height: 16px;
    color: #919699;
    padding: 12px;
    text-align: center;
  }
  .item-image {
    width: 18px;
    height: 18px;
    background-size: contain;
    margin-right: 10px;
    display: inline-block;
    vertical-align: middle;
  }
  .cell-price {
    color: #069697;
  }
  .delete {
    cursor: pointer;
    &:not(:hover) {
      & svg {
        fill: #C6CACC;
      }
    }
  }
  .create {
    justify-content: flex-end;
    display: flex;
    margin-top: 32px;
    & button {
      min-width: 140px;
      letter-spacing: 0.75px;
    }
  }
  .select-project {
    margin-top: 32px;
  }

.radio-group {
  display: flex;
  justify-content: center;
  width: 100%;
  & .radio {
    margin: 0 16px 16px;
  }
}

.status-block {
  margin-top: 20px;
}

.link-url-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.button-copy {
  background: transparent;
  border: 0;
  outline: 0;
  padding: 0;
  color: #3d7bf5;
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.75px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  cursor: pointer;
  &:active {
    color: #000000;
    & > svg {
      fill: #000000;
    }
  }
  &__text {
    padding: 4px 0 0 8px;
  }
  & > svg {
    fill: #3d7bf5;
  }
}
.panel-header {
  width: 100%;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &__col {
    width: 100%;
  }
}
.total-summary {
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: #f7f9fa;
  margin: 0 0 24px;
  &__col {
    text-align: center;
    margin: 12px 24px;
    & span {
      font-size: 12px;
      display: block;
      &:first-child {
        font-size: 16px;
        font-weight: 500;
        color: #000;
      }
    }
  }
}
</style>
