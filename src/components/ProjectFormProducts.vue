<script>
// import { required } from 'vuelidate/lib/validators';
import {
  UiButton,
  UiTextField,
  UiHeader,
  UiTable,
  UiTableCell,
  UiTableRow,
} from '@protocol-one/ui-kit';
import StatusIcon from '@/components/StatusIcon.vue';
import NoResults from '@/components/NoResults.vue';

export default {
  name: 'ProjectFormProducts',

  components: {
    UiButton,
    UiTextField,
    UiHeader,
    UiTable,
    UiTableCell,
    UiTableRow,
    StatusIcon,
    NoResults,
  },

  props: {
    project: {
      required: true,
      type: Object,
    },
  },

  data() {
    return {
      hz: true,
    };
  },

  computed: {
    products() {
      const result = [];

      if (!this.project.fixed_package) {
        return result;
      }
      Object.keys(this.project.fixed_package).forEach((regionName) => {
        const products = this.project.fixed_package[regionName];

        products.forEach((product, index) => {
          result.push({
            ...product,
            region: regionName,
            index,
          });
        });
      });
      return result;
    },
  },

};
</script>

<template>
  <div class="project-form-products">
    <UiHeader level="2" :hasMargin="true">
      Products
      <StatusIcon
        v-if="project.is_product_checkout && project.products_count > 0"
        status="complete"
      />
    </UiHeader>

    <template v-if="project.is_products_checkout">
      <div class="products-controls">
        <div>
          <router-link :to="`${$route.path}/product/new`">
            <UiButton
              class="products-controls__button"
            >
              Add product
            </UiButton>
          </router-link>
          <UiButton class="products-controls__button" :disabled="true">Use Qilin packages</UiButton>
        </div>
        <div>
          <UiTextField label="Search" :disabled="true"></UiTextField>
        </div>
      </div>

      <div class="table-container">
        <ui-table>
          <ui-table-row :isHead="true">
            <ui-table-cell>Name</ui-table-cell>
            <ui-table-cell>SKU</ui-table-cell>
            <ui-table-cell>Price</ui-table-cell>
            <ui-table-cell>Active</ui-table-cell>
          </ui-table-row>
          <ui-table-row
            v-for="(product, index) in products"
            :key="index"
            :link="`${$route.path}/product/${product.id}`"
          >
            <ui-table-cell>{{product.name}}</ui-table-cell>
            <ui-table-cell>{{product.id}}</ui-table-cell>
            <ui-table-cell>
              {{product.price}} {{product.currency ? product.currency.code_a3 : ''}}
            </ui-table-cell>
            <ui-table-cell>
              <StatusIcon v-if="product.is_active" status="complete"/>
            </ui-table-cell>
          </ui-table-row>
        </ui-table>
        <NoResults v-if="!products.length" />
      </div>
    </template>


  </div>
</template>

<style lang="scss" scoped>
.project-form-products {
}

.products-controls {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  &__button {
    margin-right: 20px;
  }
}

.table-container {
  margin: 0 -35px;
}

.switch-box {
  margin-left: 16px;
}
</style>
