<script>
import { get } from 'lodash-es';
import { mapState, mapGetters } from 'vuex';
import { required } from 'vuelidate/lib/validators';
import NoResults from '@/components/NoResults.vue';

export default {
  name: 'WebhookMethodVirtualItems',
  components: { NoResults },
  data() {
    return {
      form: {
        userId: null,
        transactionId: null,
      },
      items: [null],
    };
  },
  computed: {
    ...mapState('WebhookTest', ['virtualItems', 'projectId']),
    ...mapGetters('WebhookTest', ['virtualItemsList']),
  },
  validations: {
    form: {
      userId: { required },
      transactionId: { required },
    },
  },
  methods: {
    get,
    addItem() {
      this.items.push(null);
    },
    runTest() {
      this.$emit('input', { ...this.form, type: 'product', products: this.items });
    },
  },
};
</script>

<template>
<div>
  <div v-if="get(virtualItems, 'count', 0) > 0">
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

    <div class="items">
      <UiHeader level="4">Items</UiHeader>

      <div v-for="(item, index) in items" :key="index">
        <UiSelect
          v-model="items[index]"
          :options="virtualItemsList"
        />
      </div>

      <div
        v-if="items.length < virtualItemsList.length"
        class="add"
        @click="addItem"
      >
        <IconPlus /> Add item
      </div>
    </div>

    <div class="controls">
      <UiButton
        class="test-button"
        text="TEST"
        :disabled="$v.form.$invalid"
        @click="runTest"
      />
    </div>
  </div>

  <NoResults
    v-else
    type="add-new"
  >
    Please
    <RouterLink :to="`/projects/${projectId}/virtual-items/`">
      complete setting up this sale option
    </RouterLink>
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
.add {
  border: 1px dashed #E3E5E6;
  border-radius: 4px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #3D7BF5;

  svg {
    fill: #3D7BF5;
    margin-right: 10px;
    position: relative;
    top: -1px;
  }
  &:hover {
    border-color: #3D7BF5;
  }
}
</style>
