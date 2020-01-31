<script>
import { required } from 'vuelidate/lib/validators';
import { mapState } from 'vuex';
import NoResults from '@/components/NoResults.vue';

export default {
  name: 'WebhookMethodVirtualCurrency',
  components: { NoResults },
  data() {
    return {
      form: {
        userId: null,
        transactionId: null,
        amount: null,
      },
    };
  },
  computed: {
    ...mapState('Project', ['project']),

    active() {
      return !!this.project.virtual_currency;
    },
  },
  validations: {
    form: {
      userId: { required },
      transactionId: { required },
      amount: { required },
    },
  },
};
</script>

<template>
<div>
  <div v-if="active">
    <UiTextField
      v-model="form.userId"
      v-bind="$getValidatedFieldProps('form.userId')"
      label="User ID"
      :required="true"
    />
    <UiTextField
      v-model="form.transactionId"
      v-bind="$getValidatedFieldProps('form.transactionId')"
      label="Transaction ID"
      :required="true"
    />
    <UiTextField
      v-model="form.amount"
      v-bind="$getValidatedFieldProps('form.amount')"
      label="Virtual currency amount"
      :required="true"
    />
    <div class="controls">
      <UiButton
        class="test-button"
        text="TEST"
        :disabled="$v.form.$invalid"
        @click="$emit('input', { ...form,  type: 'virtual_currency'})"
      />
    </div>
  </div>

  <NoResults
    v-else
    type="add-new"
  >
    Please
    <router-link :to="`/projects/${projectId}/virtual-currency/`">
      complete setting up this sale option
    </router-link>
    <br>
    before testing its webhooks.
  </NoResults>
</div>
</template>

<style lang="scss" scoped>
.controls {
  margin-top: 36px;
  display: flex;
  justify-content: flex-end;
}
.test-button {
  width: 140px;
}
</style>
