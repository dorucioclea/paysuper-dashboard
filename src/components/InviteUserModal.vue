<script>
import { email, maxLength, required } from 'vuelidate/lib/validators';

export default {
  name: 'InviteUserModal',

  props: {
    title: {
      type: String,
      default: 'Invitation',
    },
    email: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      default: 'merchant_developer',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      inviteEmail: this.email,
      inviteRole: this.role,
      roles: [
        {
          label: 'Developer',
          value: 'merchant_developer',
        },
        {
          label: 'Accounting',
          value: 'merchant_accounting',
        },
        {
          label: 'Support',
          value: 'merchant_support',
        },
        {
          label: 'View Only',
          value: 'merchant_view_only',
        },
      ],
    };
  },

  validations() {
    return {
      inviteEmail: { maxLength: maxLength(100), email, required },
    };
  },
};
</script>

<template>
  <div>
    <UiModal width="448px" :hasCloseButton="true" @close="$emit('close')">
      <UiHeader
        slot="header"
        level="3"
        align="center"
      >
        {{title}}
      </UiHeader>

      <div class="content">
        <div class="descr">
          Choose a specific role for new user and invitational letter will be sent to their Email.
        </div>

        <UiTextField
          v-bind="$getValidatedFieldProps('inviteEmail')"
          v-model="inviteEmail"
          type="email"
          label="Email"
          :disabled="disabled"
          :required="true" />

        <UiSelect
          label="User role"
          :required="true"
          :options="roles"
          :disabled="disabled"
          v-model="inviteRole"
        />
      </div>

      <div class="controls">
        <UiButton
          class="modal-button"
          color="blue"
          :disabled="$v.inviteEmail.$invalid"
          @click="$emit('input', { email: inviteEmail, role: inviteRole })"
        >
          CONFIRM
        </UiButton>
      </div>
    </UiModal>
  </div>
</template>

<style lang="scss" scoped>
.content {
  padding: 0;

  .descr {
    text-align: center;
    width: 100%;
    font-size: 16px;
    margin-bottom: 16px;
  }
}

.modal-button {
  width: 100%;
}
</style>
