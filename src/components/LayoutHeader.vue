<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { directive as clickaway } from 'vue-clickaway';
import { get } from 'lodash-es';
import UserNotifications from '@/components/UserNotifications.vue';
import LeaveFeedbackPopup from '@/components/LeaveFeedbackPopup.vue';
import NotificationsMixin from '@/mixins/Notifications';
import redirectOnboardedUser from '@/helpers/redirectOnboardedUser';

export default {
  name: 'LayoutHeader',
  mixins: [NotificationsMixin],
  directives: {
    clickaway,
  },
  components: {
    UserNotifications,
    LeaveFeedbackPopup,
  },
  props: {
    projectName: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      hasStatusOpened: false,
      hasInfoOpened: false,
      hasNotificationsOpened: false,
      isLeaveFeedbackOpened: false,
      isLeaveFeedbackSuccess: false,
      openedUserMenu: false,
      statusesTitles: {
        test: 'Test Mode',
        active: 'Active',
      },
      infoItems: [
        {
          id: 'support',
          url: 'http://help.pay.super.com/',
          icon: 'IconSupport',
          text: 'Support',
        },
        {
          id: 'faq',
          url: 'http://help.pay.super.com/hc/categories/360002221019',
          icon: 'IconQuestion',
          text: 'FAQ',
        },
        {
          id: 'documentation',
          url: 'https://docs.pay.super.com/',
          icon: 'IconDocumentation',
          text: 'Documentation',
        },
        {
          id: 'leaveFeedback',
          url: '#',
          icon: 'IconPen',
          text: 'Leave Feedback',
        },
      ],
    };
  },
  computed: {
    ...mapGetters('User', ['userPermissions']),
    ...mapState('User/Merchant', ['merchantStatus', 'onboardingSteps']),
    ...mapState('User/Notifications', ['notifications']),

    status() {
      return this.merchantStatus === 'life' ? 'active' : 'test';
    },

    hasCompanyInfo() {
      return get(this.onboardingSteps, 'company', false);
    },

    newNotificationsCount() {
      return this.notifications.filter(item => item.is_read === false).length;
    },

    userMenuItems() {
      return [
        {
          id: 'payoutSettings',
          url: '#',
          icon: 'IconCash',
          text: 'Payout settings',
          active: false,
        },
        {
          id: 'company',
          url: '/company/',
          icon: 'IconCompany',
          text: 'Company info',
          active: this.userPermissions.viewCompany,
        },
        {
          id: 'userRoles',
          url: '/settings/user-roles/',
          icon: 'IconUsers',
          text: 'User roles',
          active: this.userPermissions.inviteProjectUsers && this.hasCompanyInfo,
        },
        {
          id: 'logout',
          url: '/logout/',
          icon: 'IconLogout',
          text: 'Log out',
          active: true,
        },
      ].filter(item => item.active);
    },
  },
  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('User/Notifications', ['markNotificationAsReaded']),
    ...mapActions('LeaveFeedback', ['postFeedback']),

    hideInfoBlock() {
      this.hasInfoOpened = false;
    },
    hideUserMenu() {
      this.openedUserMenu = false;
    },
    hideNotificationsBlock() {
      this.hasNotificationsOpened = false;
    },
    hideStatusBlock() {
      this.hasStatusOpened = false;
    },
    notifyToggle() {
      this.hasNotificationsOpened = !this.hasNotificationsOpened;
    },
    handleInfoBoxItemClick(event, item) {
      if (item.id === 'leaveFeedback') {
        event.preventDefault();
        this.toggleLeaveFeedback();
      }
    },
    toggleLeaveFeedback() {
      this.isLeaveFeedbackOpened = !this.isLeaveFeedbackOpened;
      if (this.isLeaveFeedbackSuccess) {
        this.$nextTick(() => {
          this.isLeaveFeedbackOpened = false;
        });
      }
    },
    hideLeaveFeedback() {
      this.isLeaveFeedbackOpened = false;
    },
    async sendFeedback(value) {
      try {
        await this.postFeedback(value);
        this.isLeaveFeedbackSuccess = true;
        this.isLeaveFeedbackOpened = false;
      } catch (error) {
        this.$_Notifications_showErrorMessage(error.message);
      }
    },

    resetPopupFeedback() {
      this.isLeaveFeedbackSuccess = false;
    },

    async navigateToHomePage() {
      redirectOnboardedUser(params => this.$navigate(params), this.userPermissions);
    },
  },
};
</script>

<template>
<div class="layout-header">
  <div class="left">
    <a
      class="logo"
      href="#"
      @click.prevent="navigateToHomePage"
    >
      PS
    </a>

    <div class="project">
      <div class="name">{{ projectName }}</div>
      <div
        :class="['status', `_${status}`, { '_opened': hasStatusOpened }]"
        v-clickaway="hideStatusBlock"
        @click="hasStatusOpened = !hasStatusOpened"
      >
        {{ statusesTitles[status] }}
        <template v-if="status === 'test'">
          <IconQuestion class="icon-question" />

          <UiTip
            innerPosition="left"
            position="bottom"
            width="calc(100vw - 100px)"
            maxWidth="280px"
            :visible="hasStatusOpened"
          >
            <div class="status-box">
              <div class="status-title">Test Mode</div>
              <div class="status-text">
                You can start your sales only after License Agreement will be signed by both
                our sides and your account become “<span class="filled-text">Active</span>”.
              </div>
            </div>
          </UiTip>
        </template>
      </div>
    </div>
  </div>

  <div class="right">
    <div style="position: relative">
      <a
        class="feedback"
        href="#"
        @click="toggleLeaveFeedback"
      >Feedback about this page?</a>
      <UiTip
        innerPosition="right"
        position="bottom"
        width="330px"
        :visible="isLeaveFeedbackOpened"
        :closeDelay="isLeaveFeedbackSuccess ? 1500 : 0"
        :stayOpenedOnHover="isLeaveFeedbackSuccess ? true : false"
        @afterClose="resetPopupFeedback"
      >
        <LeaveFeedbackPopup
          :isVisible="isLeaveFeedbackOpened"
          :isSuccess="isLeaveFeedbackSuccess"
          @send="sendFeedback"
          @close="hideLeaveFeedback"
        />
      </UiTip>
    </div>
    <div
      :class="['right-icon', { '_active': hasInfoOpened }]"
      v-clickaway="hideInfoBlock"
      @click="hasInfoOpened = !hasInfoOpened"
    >
      <IconInfo />

      <UiTip
        innerPosition="right"
        position="bottom"
        width="calc(100vw - 140px)"
        maxWidth="220px"
        :visible="hasInfoOpened"
        :closeDelay="0"
        :stayOpenedOnHover="false"
      >
        <div class="info-box">
          <a
            class="info-item"
            v-for="(item, index) in infoItems"
            :key="index"
            :href="item.url"
            target="_blank"
            @click="handleInfoBoxItemClick($event, item)"
          >
            <component :is="item.icon" class="info-icon" />
            <div class="info-text">{{ item.text }}</div>
          </a>
        </div>
      </UiTip>
    </div>

    <div
      :class="['right-icon', { '_active': hasNotificationsOpened }]"
      v-clickaway="hideNotificationsBlock"
    >
      <div
        class="notify-icon"
        @click="hasNotificationsOpened = !hasNotificationsOpened"
      >
        <IconNotify />
        <div
          v-if="newNotificationsCount"
          class="notify-count"
        >
          {{ newNotificationsCount }}
        </div>
      </div>

      <UiTip
        innerPosition="right"
        position="bottom"
        width="calc(100vw - 140px)"
        maxWidth="400px"
        :visible="hasNotificationsOpened"
        :closeDelay="0"
        :stayOpenedOnHover="false"
      >
        <UserNotifications
          :items="notifications"
          @close="hideNotificationsBlock"
          @markAsReaded="markNotificationAsReaded"
        />
      </UiTip>
    </div>

    <div
      :class="['right-icon', { '_active': openedUserMenu }]"
      v-clickaway="hideUserMenu"
      @click="openedUserMenu = !openedUserMenu"
    >
      <IconUser />

      <UiTip
        innerPosition="right"
        position="bottom"
        width="calc(100vw - 140px)"
        maxWidth="220px"
        :visible="openedUserMenu"
        :closeDelay="0"
        :stayOpenedOnHover="false"
      >
        <div class="info-box">
          <RouterLink
            v-for="(item, index) in userMenuItems"
            :key="index"
            :class="['info-item', { '_logout': item.id === 'logout' }]"
            :to="item.url"
          >
            <component :is="item.icon" class="info-icon" />
            <div class="info-text">
              {{ item.text }}
            </div>
          </RouterLink>
        </div>
      </UiTip>
    </div>

  </div>
</div>
</template>

<style lang="scss" scoped>
.layout-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-content: center;
  width: 100%;
  padding: 4px 16px;
  background: #fff;
  box-shadow: 0px 1px 2px rgba(8, 35, 48, 0.24),
    0px 2px 6px rgba(8, 35, 48, 0.16);
  flex-wrap: wrap;
  align-content: stretch;
  z-index: 20;
}
.left,
.right {
  display: flex;
  align-content: center;
  align-items: center;
  padding: 8px 0;
}
.left {
  margin-right: 16px;
}
.logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #c6cacc;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  text-decoration: none;
  font-size: 20px;
  font-weight: 500;
  color: #5e6366;
  font-family: Quicksand;
}
.project {
  display: flex;
  flex-direction: column;
}
.name {
  color: #5e6366;
  font-family: Quicksand;
  font-weight: 500;
  letter-spacing: 0.44px;
  font-size: 16px;
  line-height: 24px;
  text-decoration: none;
}
.status {
  position: relative;
  display: flex;
  align-content: center;
  align-items: center;
  font-family: Roboto;
  letter-spacing: 0.4px;
  font-size: 12px;
  line-height: 16px;
  transition: color 0.2s ease-out;

  &._test {
    color: #f3aa18;
    cursor: pointer;
  }
  &._active {
    color: #2fa84f;
  }
}
.icon-question {
  fill: #f3aa18;
  margin-left: 6px;
  transition: fill 0.2s ease-out;
}
.status-box {
  padding: 24px;
}
.status-title {
  font-family: Quicksand;
  font-weight: 500;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0.15px;
  color: #f3aa18;
}
.status-text {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0.25px;
  color: #3e4345;
  margin-top: 16px;
}
.filled-text {
  color: #069697;
}
.feedback {
  font-size: 12px;
  line-height: 20px;
  letter-spacing: 0.4px;
  padding: 0 16px 0 0;
  border-right: 1px solid #e3e5e6;
}
.right-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  margin-left: 16px;
  background-color: transparent;
  transition: background-color 0.2s ease-out;
  cursor: pointer;
  position: relative;

  &._active,
  &:hover {
    background-color: #f1f3f4;
  }
}
.icon-user {
  border: 1px solid #c6cacc;
}
.info-box {
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}
.info-item {
  position: relative;
  display: flex;
  height: 32px;
  background-color: transparent;
  align-content: center;
  align-items: center;
  transition: background-color 0.2s ease-out, color 0.2s ease-out;
  color: #000;
  cursor: pointer;

  &:hover {
    background-color: rgba(#3d7bf5, 0.1);
  }

  &:not(:first-child)._logout {
    margin-top: 17px;

    &::before {
      content: "";
      position: absolute;
      top: -9px;
      left: 0;
      background: #f1f3f4;
      height: 1px;
      width: 100%;
    }
  }
}
.info-text {
  font-size: 14px;
  line-height: 31px;
}
.info-icon {
  margin-left: 20px;
  margin-right: 12px;
  width: 16px;
  height: 16px;

  .info-item:hover & {
    fill: #3d7bf5;
  }
}
.notify-icon {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}
.notify-count {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: -4px;
  right: -2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-color: #3d7bf5;
}

.role-switch {
  font-size: 12px;
  color: #3d7bf5;
  cursor: pointer;

  &._current {
    cursor: default;
    color: #919699;
  }
}
</style>
