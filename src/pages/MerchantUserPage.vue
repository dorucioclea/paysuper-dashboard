<script>
import { mapActions, mapState, mapGetters } from 'vuex';
import { find, get } from 'lodash-es';
import roleScheme from '@/schemes/userRolesStatusScheme';
import UserRolePageStore from '@/store/UserRolePageStore';
import InviteUserModal from '@/components/InviteUserModal.vue';
import InviteUserSuccessModal from '@/components/InviteUserSeccessModal.vue';

export default {
  name: 'MerchantUserPage',

  components: {
    InviteUserModal,
    InviteUserSuccessModal,
  },

  data() {
    return {
      scheme: roleScheme,
      inviteModal: false,
      inviteSuccessModal: false,
      showDeleteConfirm: false,
      showChangeRoleConfirm: false,
      newRole: null,
    };
  },

  async asyncData({
    store,
    registerStoreModule,
    route,
    resources,
  }) {
    try {
      await registerStoreModule('UserRolePage', UserRolePageStore, {
        roleId: route.params.id,
      }).catch(resources.notifications.showErrorMessage);
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  computed: {
    ...mapState('UserRolePage', ['user']),
    ...mapGetters('User', ['userPermissions']),

    userRole() {
      return find(this.scheme, { value: this.user.role });
    },

    color() {
      return get(this.userRole, 'color', 'red');
    },

    status() {
      return get(this.userRole, 'status', 'Owner');
    },
  },

  methods: {
    ...mapActions(['setIsLoading']),
    ...mapActions('UserRolePage', ['resendInvite', 'delete', 'changeRole']),

    handleAddUser(user) {
      this.setIsLoading(true);
      this.resendInvite(user)
        .then(() => {
          this.inviteSuccessModal = true;
        })
        .catch(this.$showErrorMessage)
        .finally(() => {
          this.inviteModal = false;
          this.setIsLoading(false);
        });
    },

    deleteUser() {
      this.delete(this.user).catch(this.$showErrorMessage);
      this.showDeleteConfirm = false;
      this.$navigate('/settings/user-roles/');
    },

    getLabelColor(role) {
      return get(find(this.scheme, { value: role }), 'color');
    },

    getRoleName(role) {
      return get(find(this.scheme, { value: role }), 'status');
    },

    handleChangeRole(role) {
      this.newRole = role.value;
      this.showChangeRoleConfirm = true;
    },
  },
};
</script>

<template>
  <div>
    <UiPageHeaderFrame>
      <template slot="title">
        User {{ user.id }}
      </template>
      <span slot="description">
        <template v-if="user.status === 'invited'">
          <UiLabelTag color="yellow">Invited</UiLabelTag>
        </template>
        <template v-else>
          <template v-if="userPermissions.inviteProjectUsers">
            <UiLabelSwitch
              v-if="user.role !== 'merchant_owner'"
              :value="user.role"
              :scheme="scheme"
              @input="handleChangeRole($event, user)"/>
            <UiLabelTag v-else color="red" class="owner-label">Owner</UiLabelTag>
          </template>
          <template v-else>
            <UiLabelTag :color="getLabelColor(user.role)">
              {{ getRoleName(user.role) }}
            </UiLabelTag>
          </template>
        </template>
      </span>
    </UiPageHeaderFrame>

    <UiPanel>
      <div class="details">
        <UiHeader level="3" class="details__header">Personal data</UiHeader>
        <div class="details__container bordered">
          <div class="details__item">
            <div class="details__item--label">Firts name</div>
            <div class="details__item--info">
              {{ user.first_name }}
            </div>
          </div>

          <div class="details__item">
            <div class="details__item--label">Last name</div>
            <div class="details__item--info">
              {{ user.last_name }}
            </div>
          </div>

          <div class="details__item">
            <div class="details__item--label">Email</div>
            <div class="details__item--info">
              {{ user.email }}
            </div>
          </div>

          <div class="details__item">
            <div class="details__item--label">User role</div>
            <div class="details__item--info">
              {{ status }}
            </div>
          </div>
        </div>
      </div>

      <div class="controls" v-if="status !== 'Owner' && userPermissions.inviteProjectUsers">
        <UiButton
          class="controls__button"
          color="red"
          :isTransparent="true"
          @click="showDeleteConfirm = true">
          DELETE
        </UiButton>
        <UiButton
          class="controls__button"
          color="blue"
          v-if="user.status === 'invited'"
          @click="inviteModal = true">
          RESEND INVITE
        </UiButton>
      </div>
    </UiPanel>

    <UiConfirm
      v-if="showDeleteConfirm"
      title="Delete item"
      buttonText="DELETE"
      buttonColor="red"
      @close="showDeleteConfirm=false"
      @confirm="deleteUser">
      Are you sure you want to assign a new role for this user {{user.email}}?
    </UiConfirm>

    <InviteUserModal
      title="Resend invitation"
      :role="user.role"
      :email="user.email"
      :disabled="true"
      v-if="inviteModal"
      @close="inviteModal = false"
      @input="handleAddUser" />

    <InviteUserSuccessModal
      v-show="inviteSuccessModal"
      @close="inviteSuccessModal = false" />

    <UiConfirm
      v-if="showChangeRoleConfirm"
      title="Change role"
      buttonText="CONFIRM"
      buttonColor="blue"
      @close="showChangeRoleConfirm=false"
      @confirm="confirmChangeRole">
      <div class="change-role">
        <div class="change-role__labels">
          <UiLabelTag :color="color">
            {{ status }}
          </UiLabelTag>

          <IconThinRightArrow class="change-role__dir"/>

          <UiLabelTag :color="getLabelColor(this.newRole)">
            {{ getRoleName(this.newRole) }}
          </UiLabelTag>
        </div>
        Are you sure you want to assign a new role for this user <br> {{selectedUser.email}}?
      </div>
    </UiConfirm>
  </div>
</template>

<style lang="scss" scoped>
.details {
  margin-top: 32px;

  &__header {
    margin-bottom: 16px;
    width: 100%;
  }

  &__container {
    display: flex;
    flex-wrap: wrap;
  }

  &__item {
    flex-basis: 50%;
    padding: 0 0 20px 12px;
    position: relative;

    &--label {
      color: #5e6366;
      font-size: 12px;
      margin-bottom: 5px;
    }

    &--info {
      color: #000;
      letter-spacing: 0.44px;
      overflow-wrap: break-word;
      max-width: 428px;
      overflow: hidden;
    }
  }

  .bordered {
    border-bottom: 1px solid rgba(227, 229, 230, 0.8);
  }
}

.controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 47px;

  &__button {
    margin-left: 12px;
  }
}
</style>
