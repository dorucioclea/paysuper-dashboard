<script>
import { debounce, isEqual, find } from 'lodash-es';
import {
  mapState, mapGetters, mapActions, mapMutations,
} from 'vuex';
import PictureWoomanLooking from '@/components/PictureWomanLooking.vue';
import NoResults from '@/components/NoResults.vue';
import ProjectVirtualItemsStore from '@/store/ProjectVirtualItemsStore';
import projectProductsStatusScheme from '@/schemes/projectProductsStatusScheme';

export default {
  name: 'ProjectVirtualItemsPage',

  components: {
    NoResults,
    PictureWoomanLooking,
  },

  data() {
    return {
      filters: {},
      isSearchRouting: false,
      isInfiniteScrollLocked: false,
      openedTooltipId: '',
      showDeleteConfirm: false,
      selectedItem: null,
      scheme: projectProductsStatusScheme,
    };
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('ProjectVirtualItems', ProjectVirtualItemsStore, {
        query: route.query,
        projectId: route.params.id,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  computed: {
    ...mapState('Project', ['project', 'defaultCurrency']),
    ...mapState('ProjectVirtualItems', ['virtualItems', 'filterValues', 'query', 'apiQuery', 'currentItem']),
    ...mapGetters('ProjectVirtualItems', ['getFilterValues']),
    ...mapGetters('User', ['userPermissions']),

    viewOnly() {
      return !this.userPermissions.editProjects;
    },

    handleQuickSearchInput() {
      return debounce(() => {
        this.filterItems();
      }, 500);
    },
  },

  async beforeRouteUpdate(to, from, next) {
    if (!this.isSearchRouting) {
      this.initQuery(to.query);
      this.updateFiltersFromQuery();
      this.setIsLoading(true);
      await this.fetchItems().catch(this.$showErrorMessage);
      this.setIsLoading(false);
    }
    this.isSearchRouting = false;
    next();
  },

  created() {
    this.updateFiltersFromQuery();
  },

  mounted() {
    this.initInfiniteScroll();
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('ProjectVirtualItems', [
      'initQuery',
      'createItem',
      'submitFilters',
      'fetchItems',
      'deleteItem',
      'editItem',
    ]),
    ...mapMutations('ProjectVirtualItems', ['setCurrentItem']),

    updateFiltersFromQuery() {
      this.filters = this.getFilterValues(['quickFilter', 'offset', 'limit']);
    },

    filterItems() {
      this.filters.offset = 0;
      this.searchItems();
    },

    async searchItems() {
      this.isSearchRouting = true;
      this.setIsLoading(true);
      this.submitFilters(this.filters);
      this.navigate();
      await this.fetchItems().catch(this.$showErrorMessage);
      this.setIsLoading(false);
    },

    initInfiniteScroll() {
      this.$appEventsOn('contentScrollReachEnd', async () => {
        if (
          this.isInfiniteScrollLocked
          || this.filters.offset + this.filters.limit >= this.virtualItems.count
        ) {
          return;
        }
        this.isInfiniteScrollLocked = true;

        this.filters.offset += this.filters.limit;
        await this.searchItems();
        this.isInfiniteScrollLocked = false;
      });
    },

    navigate() {
      if (isEqual(this.$route.query, this.query)) {
        return;
      }
      this.$router.push({
        path: this.$route.path,
        query: this.query,
      });
    },

    createNew() {
      this.$router.push({
        name: 'ProjectVirtualItemEdit',
        params: { itemId: 'new' },
      });
    },

    goToItemPage(item) {
      this.setCurrentItem(item);
      this.setIsLoading(true);
      this.$router.push({
        name: 'ProjectVirtualItemEdit',
        params: { itemId: item.id },
      });
    },

    showConfirm(item) {
      this.selectedItem = item;
      this.showDeleteConfirm = true;
    },

    async deleteSeletedItem() {
      this.showDeleteConfirm = false;
      this.setIsLoading(true);
      await this.deleteItem(this.selectedItem.id).catch(this.$showErrorMessage);
      this.selectedItem = null;
      this.setIsLoading(false);
    },

    async toggleItemStatus(item) {
      this.setIsLoading(true);
      await this.editItem({
        data: Object.assign(item, { enabled: !item.enabled }),
        projectId: this.$route.params.id,
      });
      await this.searchItems();
      this.setIsLoading(false);
    },

    handleStatusInput(value) {
      this.filters.enabled = value;
      this.filterItems();
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
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame>
      <template slot="title">
        Virtual items
      </template>
      <span slot="description">
        This sales option will allow you to sell your Virtual Items, like <b>swords, guns,
          helmets</b> and virtual currency packs.
      </span>
      <PictureWoomanLooking slot="picture"/>
    </UiPageHeaderFrame>

    <UiPanel>
      <div class="control-bar">
        <div class="control-bar__left">
          <UiFilterSearchInput
            :isAlwaysExpanded="true"
            v-model="filters.quickFilter"
            @input="handleQuickSearchInput" />
          <UiStatusFilter
            @input="handleStatusInput"
            :scheme="scheme"
            :value="filters.enabled" />
        </div>

        <div class="control-bar__right">
          <UiButton
            :isTransparent="true"
            color="transparent-blue"
            class="quilin-packages-button"
            :disabled="true"
          >
            <IconUpload slot="iconBefore" class="upload-icon" fill="#919699" />
            QUILIN PACKAGES
          </UiButton>
          <UiButton text="ADD ITEM" @click.prevent="createNew" v-if="!viewOnly"></UiButton>
        </div>
      </div>

      <div class="items-list">
        <UiTable v-if="virtualItems.items.length">
          <UiTableRow :isHead="true">
            <UiTableCell width="40px" align="center">
              <span class="leading-cell-content">№</span>
            </UiTableCell>
            <UiTableCell width="50px" align="center">&nbsp;</UiTableCell>
            <UiTableCell width="200px" align="left">Virtual item</UiTableCell>
            <UiTableCell width="200px" align="left">SKU</UiTableCell>
            <UiTableCell align="left">Price</UiTableCell>
            <UiTableCell width="15%" align="left">Status</UiTableCell>
            <UiTableCell width="5%" align="left" v-if="!viewOnly"></UiTableCell>
          </UiTableRow>
          <UiTableRow
            class="content-row"
            v-for="(item, index) in virtualItems.items"
            :key="item.id"
            :link="`/projects/${project.id}/virtual-items/${item.id}`"
          >
            <UiTableCell width="40px" align="center" valign="middle">
              <span class="leading-cell-content">{{ index + 1 }}</span>
            </UiTableCell>
            <UiTableCell width="40px" align="center" valign="middle">
              <div
                v-if="item.images !== null"
                :style="{ backgroundImage: `url(${item.images[0]})` }"
                class="item-image">
              </div>
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
              <span class="cell-text vi-name">{{ item.sku }}</span>
            </UiTableCell>
            <UiTableCell width="110px" align="left" valign="middle" :title="getItemPrice(item)">
              <UiNoText v-if="!getItemPrice(item)" />
              <span v-else class="cell-text">
                {{ getItemPrice(item) }}
              </span>
            </UiTableCell>
            <UiTableCell width="100px" align="left" valign="middle">
              <UiLabelTag
                :color="item.enabled ? 'green': 'transparent'"
              >
                {{ item.enabled ? 'Enabled': 'Disabled' }}
              </UiLabelTag>
            </UiTableCell>
            <UiTableCell
              class="cell"
              align="left"
              valign="middle"
              v-if="!viewOnly"
              @mouseenter.native="openedTooltipId = item.id"
              @mouseleave.native="() => openedTooltipId = ''"
              :noPadding="true"
            >
              <UiDotsMenuTrigger
                class="dots-menu-trigger"
                :isOpened="openedTooltipId === item.id"
              />

              <UiTip
                innerPosition="right"
                position="bottom"
                width="180px"
                :margin="0"
                :visible="openedTooltipId === item.id"
                :closeDelay="0"
                :stayOpenedOnHover="false"
              >
                <UiTooltipMenuItem
                  iconComponent="IconPen"
                  @click.stop.prevent="goToItemPage(item)"
                >
                  Edit
                </UiTooltipMenuItem>
                <UiTooltipMenuItem
                  :iconComponent="item.enabled ? 'IconDeactivate' : 'IconPlayTriangle'"
                  @click.prevent="toggleItemStatus(item)"
                >
                  {{ item.enabled ? 'Disable': 'Enable' }}
                </UiTooltipMenuItem>
                <UiTooltipMenuItem
                  iconComponent="IconDelete"
                  type="delete"
                  @click.stop.prevent="showConfirm(item)"
                >
                  Delete
                </UiTooltipMenuItem>
              </UiTip>
            </UiTableCell>
          </UiTableRow>
        </UiTable>

        <NoResults type="add-new" v-else>You don’t have any item yet</NoResults>
      </div>
    </UiPanel>

    <UiConfirm
      v-if="showDeleteConfirm && selectedItem"
      title="Delete item"
      buttonText="DELETE"
      buttonColor="red"
      @close="showDeleteConfirm=false"
      @confirm="deleteSeletedItem">
      Are you sure you want to delete {{ selectedItem.name.en }}?
    </UiConfirm>
  </div>
</template>

<style lang="scss" scoped>
.control-bar {
  display: flex;
  justify-content: space-between;
}
.quilin-packages-button {
  margin-right: 10px;
}
.items-list {
  margin-top: 32px;
}

.cell {
  position: relative;
}

.dots-menu-trigger {
  margin-top: 4px;
}

.item-image {
  width: 18px;
  height: 18px;
  background-size: contain;
  margin-right: 10px;
  display: inline-block;
  vertical-align: middle;
}

.status-filter {
  margin-left: 4px;
  position: relative;
  top: 1px;
}

.vi-name {
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 184px;
  overflow: hidden;
}
</style>
