<script>
import { mapState, mapGetters } from 'vuex';
import { cloneDeep } from 'lodash-es';
import { required, maxLength, url } from 'vuelidate/lib/validators';

export default {
  name: 'ProjectPaymentFormPage',

  data() {
    return {
      projectLocal: null,
    };
  },

  computed: {
    ...mapState('Project', ['project']),
    ...mapGetters('User', ['userPermissions']),

    viewOnly() {
      return !this.userPermissions.editProjects;
    },
  },

  validations: {
    projectLocal: {
      url_redirect_success: {
        required,
        url,
        maxLength: maxLength(500),
      },
      url_redirect_fail: {
        required,
        url,
        maxLength: maxLength(500),
      },
    },
  },

  watch: {
    project() {
      this.updateProjectLocal();
    },
  },

  created() {
    this.updateProjectLocal();
  },

  methods: {
    updateProjectLocal() {
      this.projectLocal = cloneDeep(this.project);
    },
    handleSave() {
      this.$v.$touch();
      if (!this.$v.$invalid) {
        this.$emit('save', this.projectLocal);
      }
    },
  },
};
</script>

<template>
<div>
  <UiPageHeaderFrame>
    <template slot="title">
      Payment form
    </template>
  </UiPageHeaderFrame>

  <UiPanel>
    <UiHeader
      :hasMargin="true"
      level="3"
    >
      Redirect URLs
    </UiHeader>
    <UiText indentBottom="small">
      Input here specific page URL where your customers will
      be redirected after successful or failed payment.
    </UiText>
    <UiTextField
      label="Payment success redirect URL"
      :autocompleteUrlProtocol="true"
      :disabled="viewOnly"
      v-model="projectLocal.url_redirect_success"
      v-bind="$getValidatedFieldProps('projectLocal.url_redirect_success')"
    />
    <UiTextField
      label="Payment fail redirect URL"
      :autocompleteUrlProtocol="true"
      :disabled="viewOnly"
      v-model="projectLocal.url_redirect_fail"
      v-bind="$getValidatedFieldProps('projectLocal.url_redirect_fail')"
    />

    <div class="controls" v-if="!viewOnly">
      <UiButton
        :disabled="$v.projectLocal.$invalid"
        class="submit-button"
        text="SAVE"
        @click="handleSave"
      />
    </div>
  </UiPanel>
</div>
</template>


<style lang="scss" scoped>
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
