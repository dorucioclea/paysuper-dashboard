<script>
import { required } from 'vuelidate/lib/validators';

export default {
  name: 'WebhookMethodSimpleCheckout',
  data() {
    return {
      form: {
        userId: null,
        transactionId: null,
        amount: null,
        currency: null,
      },
    };
  },
  validations: {
    form: {
      userId: { required },
      transactionId: { required },
      amount: { required },
      currency: { required },
    },
  },
};
</script>

<template>
<div>
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
    label="Amount"
    :required="true"
  />
  <UiTextField
    v-model="form.currency"
    v-bind="$getValidatedFieldProps('form.currency')"
    label="Currency"
    :required="true"
  />

  <div class="controls">
    <UiButton
      class="test-button"
      text="TEST"
      :disabled="$v.form.$invalid"
      @click="$emit('input', { ...form,  type: 'simple'})"
    />
  </div>
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
