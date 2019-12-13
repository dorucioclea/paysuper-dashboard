<script>
import {
  mapState, mapGetters, mapActions,
} from 'vuex';
import {
  isEqual, get,
} from 'lodash-es';
import moment from 'moment';
import PaymentLinksListStore from '@/store/PaymentLinksListStore';
import NoResults from '@/components/NoResults.vue';
import PictureWebLines from '@/components/PictureWebLines.vue';


const STATUS_COLOR = {
  false: 'green',
  true: 'transparent',
};

const STATUS = {
  false: 'Active',
  true: 'Expired',
};

export default {
  name: 'PaymentLinksPage',

  components: {
    PictureWebLines,
    NoResults,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('Links', PaymentLinksListStore, {
        query: route.query,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      openedLinkId: null,
      isDeleteModalOpened: false,
      linkIdForAction: null,
    };
  },

  computed: {
    ...mapState('Links', ['linksList']),
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('Links', [
      'createItem',
      'fetchLinks',
      'deleteLink',
    ]),

    get,

    filterLinks() {
      this.filters.offset = 0;
      this.searchItems();
    },

    async searchItems() {
      this.isSearchRouting = true;
      this.setIsLoading(true);
      this.navigate();
      await this.fetchReports().catch(this.$showErrorMessage);
      this.setIsLoading(false);
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

    getColor(status) {
      return STATUS_COLOR[status];
    },

    getStatus(status) {
      return STATUS[status];
    },

    formatDate(date) {
      return moment.unix(date).format('D MMM YYYY, HH:MM');
    },

    goToItemPage(link) {
      this.setIsLoading(true);
      this.$router.push({
        name: 'PaymentLinksCard',
        params: { linkId: link.id },
      });
    },

    createNew() {
      this.$router.push({
        name: 'PaymentLinksCard',
        params: { linkId: 'new' },
      });
    },

    openDeleteDialog(linkId) {
      this.isDeleteModalOpened = true;
      this.linkIdForAction = linkId;
    },

    async tryToDeleteLink() {
      this.setIsLoading(true);
      try {
        await this.deleteLink(this.linkIdForAction);
        this.$showSuccessMessage('Link has been delete');
      } catch (error) {
        this.$showErrorMessage(error);
      }
      this.setIsLoading(false);
      this.isDeleteModalOpened = false;
    },
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame :pictureGrow="false" class="picture">
      <template slot="title">
        Payment links
      </template>
      <span slot="description">
        Here you can create special payment links, that can be
        placed on any web page and sell your goods to customers by simple click.
      </span>
      <PictureWebLines slot="picture" />
    </UiPageHeaderFrame>

    <UiPanel>
      <div class="control-bar">
        <div class="control-bar__left"/>
        <div class="control-bar__right">
          <UiButton @click="createNew">
            CREATE LINK
          </UiButton>
        </div>
      </div>

      <div class="links-list">
        <UiTable v-if="linksList.items.length">
          <UiTableRow :isHead="true">
            <UiTableCell align="left">Name</UiTableCell>
            <UiTableCell align="left">Link ID</UiTableCell>
            <UiTableCell align="left">Visits</UiTableCell>
            <UiTableCell align="left">Purchases</UiTableCell>
            <UiTableCell align="left">Conversion</UiTableCell>
            <UiTableCell align="left">Total</UiTableCell>
            <UiTableCell align="left">Due date</UiTableCell>
            <UiTableCell align="left" width="3%"></UiTableCell>
          </UiTableRow>
          <UiTableRow
            class="link"
            v-for="(link, index) in linksList.items"
            :key="index"
            :link="`/payment-links/${link.id}`"
            >
            <UiTableCell style="position: relative;" align="left">
              <div class="status-dot"
                :class="getColor(link.is_expired)"
                :title="getStatus(link.is_expired)"
              >
              </div>
              {{ link.name }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ link.id }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ link.visits }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ link.gross_total_amount }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ link.conversion }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ link.sales_count }}
            </UiTableCell>
            <UiTableCell align="left">
              {{ formatDate(link.expires_at.seconds) }}
             </UiTableCell>
            <UiTableCell
              class="cell-with-menu"
              align="left"
              valign="middle"
              @mouseenter.native="openedLinkId = link.id"
              @mouseleave.native="() => openedLinkId = null"
              :noPadding="true"
            >
              <div class="dots-menu">
                <UiDotsMenuTrigger
                  class="dots-menu-trigger"
                  :isOpened="openedLinkId === link.id"
                />
                <UiTip
                  innerPosition="right"
                  position="bottom"
                  width="180px"
                  :margin="0"
                  :visible="openedLinkId === link.id"
                  :closeDelay="0"
                  :stayOpenedOnHover="false"
                >
                  <UiTooltipMenuItem
                    class="dots-menu__item"
                    iconComponent="IconPen"
                    @click.stop.prevent="goToItemPage(link)"
                  >
                   <IconDispute slot="iconBefore" />
                    Edit
                  </UiTooltipMenuItem>
                  <UiTooltipMenuItem
                    class="dots-menu__item"
                    iconComponent="IconDelete"
                    @click.stop.prevent="openDeleteDialog(link.id)"
                  >
                    Delete
                  </UiTooltipMenuItem>
                </UiTip>
              </div>
            </UiTableCell>
          </UiTableRow>
        </UiTable>

        <NoResults type="add-new" v-else>You don’t have any item yet</NoResults>
      </div>
    </UiPanel>

    <UiDeleteModal
      v-if="isDeleteModalOpened"
      title="Delete"
      submitButtonText="Delete"
      @close="isDeleteModalOpened = false"
      @submit="tryToDeleteLink"
    >
      You can delete the link, if you want to stop all activities in it.
    </UiDeleteModal>

  </div>
</template>

<style lang="scss" scoped>
.control-bar {
  display: flex;
  justify-content: space-between;
}

.status-filter {
  margin-left: 4px;
  position: relative;
  top: 1px;
}

.links-list {
  margin-top: 32px;
}

.link {
  &:hover {
    background: rgba(61, 123, 245, 0.08);
    color: #3d7bf5;
    cursor: pointer;
  }

  &__status {
    position: relative;
    & .label-tag {
      width: 104px;
    }
    &-flag {
      margin-right: 3px;
    }
    &-tip {
      display: none;
      background: #000;
      border-radius: 4px;
      color: #fff;
      font-size: 12px;
      text-align: left;
      line-height: 16px;
      box-shadow: none;
      padding: 12px;

      &:after {
        display: block;
        content: "";
        width: 6px;
        height: 6px;
        position: absolute;
        bottom: -4px;
        background: #000000;
        transform: rotate(45deg);
      }
    }

    &:hover &-tip {
      display: block;
    }
  }
}

.status-paid {
  color: #069697;
}

.cell-with-menu {
  position: relative;
  padding-right: 5px;
}
.dots-menu {
  position: relative;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-sizing: border-box;
  display: inline-block;
  position: relative;
  top: -2px;
  margin-right: 5px;

  &.green {
    background: #2fa84f;
  }

  &.transparent {
    border: 1px solid #919699;
  }
}

.picture {
  justify-content: space-between;
}
</style>
