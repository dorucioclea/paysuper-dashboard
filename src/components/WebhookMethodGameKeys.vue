<script>
import { get } from 'lodash-es';
import { mapState, mapGetters } from 'vuex';
import { required } from 'vuelidate/lib/validators';
import NoResults from '@/components/NoResults.vue';

export default {
  name: 'WebhookMethodGameKeys',
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
    ...mapState('WebhookTest', ['keys', 'projectId']),
    ...mapGetters('WebhookTest', ['keysList']),
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
      this.$emit('input', { ...this.form, type: 'key', products: this.items });
    },
  },

};
</script>

<template>
<div>
  <div v-if="get(keys, 'count', 0) > 0">
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
      <UiHeader level="4">Keys</UiHeader>

      <div v-for="(item, index) in items" :key="index">
        <UiSelect
          v-model="items[index]"
          :options="keysList"
        />
      </div>

      <div
        v-if="items.length < keysList.length"
        class="add"
        @click="addItem"
      >
        <IconPlus /> Add key
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
    <RouterLink :to="`/projects/${projectId}/game-keys/`">
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
