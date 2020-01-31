<script>
import { mapActions, mapState } from 'vuex';
import { cloneDeep } from 'lodash-es';
import {
  required,
  minLength,
  maxLength,
  url,
} from 'vuelidate/lib/validators';
import KeyGenerateField from '@/components/KeyGenerateField.vue';
import PictureDotsAndSquaresScheme from '@/components/PictureDotsAndSquaresScheme.vue';
import WebhookMethodGameKeys from '@/components/WebhookMethodGameKeys.vue';
import WebhookMethodSimpleCheckout from '@/components/WebhookMethodSimpleCheckout.vue';
import WebhookMethodVirtualCurrency from '@/components/WebhookMethodVirtualCurrency.vue';
import WebhookMethodVirtualItems from '@/components/WebhookMethodVirtualItems.vue';
import WebhookTestResult from '@/components/WebhookTestResult.vue';
import WebhookTestStore from '@/store/WebhookTestStore';

export default {
  name: 'ProjectWebhooksPage',

  components: {
    KeyGenerateField,
    PictureDotsAndSquaresScheme,
    WebhookMethodGameKeys,
    WebhookMethodSimpleCheckout,
    WebhookMethodVirtualCurrency,
    WebhookMethodVirtualItems,
    WebhookTestResult,
  },

  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('WebhookTest', WebhookTestStore, route.params.id);
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },

  data() {
    return {
      projectLocal: {},
      modes: [
        { label: 'Default', value: 'default' },
        { label: 'Pre-approval', value: 'pre_approval' },
      ],
      tabs: [
        { label: 'Simple checkout', value: 'simple' },
        { label: 'Virtual currency', value: 'virtual_currency' },
        { label: 'Virtual items', value: 'virtual_items' },
        { label: 'Game keys', value: 'keys' },
      ],
      currentTabIndex: 0,
      tabsComponents: {
        simple: WebhookMethodSimpleCheckout,
        virtual_currency: WebhookMethodVirtualCurrency,
        virtual_items: WebhookMethodVirtualItems,
        keys: WebhookMethodGameKeys,
      },
    };
  },

  computed: {
    ...mapState('Project', ['project']),
    ...mapState('User/Merchant', ['merchant']),
    ...mapState('WebhookTest', ['projectId', 'results']),

    isWebhooksEnabled: {
      get() {
        if (this.projectLocal.callback_protocol === 'default') {
          return true;
        }
        return false;
      },
      set(value) {
        this.projectLocal.callback_protocol = value ? 'default' : 'empty';
      },
    },
  },

  validations: {
    projectLocal: {
      url_process_payment: {
        required,
        url,
        maxLength: maxLength(500),
      },
      secret_key: {
        required,
        minLength: minLength(12),
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

    const webhookMode = this.projectLocal.webhook_mode || 'default';
    this.projectLocal.webhook_mode = webhookMode;
  },

  methods: {
    ...mapActions('WebhookTest', ['sendTestWebhook']),

    async handleTest(data) {
      await this.sendTestWebhook(data);
    },
    updateProjectLocal() {
      this.projectLocal = cloneDeep(this.project);
    },
    saveProject() {
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
      Webhooks
    </template>
    <template slot="description">
      In this section we will setup and test two-way notifications between our systems,
      so all orders and commands would work as intended.
      This is an obligatory requirement for all kind of sales options.
    </template>
    <PictureDotsAndSquaresScheme slot="picture" />
  </UiPageHeaderFrame>

  <UiPanel>
    <div class="blocks">
      <div class="block">
        <IconUserStroke />
        <div class="block-content">
          <div class="block-value">
            {{ merchant.id }}
          </div>
          <div class="block-label">Merchant ID</div>
        </div>
      </div>
      <div class="block">
        <IconFolder width="26" height="21" fill="#3D7BF5" />
        <div class="block-content">
          <div class="block-value">
            {{ project.id }}
          </div>
          <div class="block-label">Project ID</div>
        </div>
      </div>
    </div>

  </UiPanel>

  <UiPanel>
    <div class="section">
      <UiHeader
        :hasMargin="true"
        level="3"
      >
        Functional URL`s
      </UiHeader>
      <UiText indentBottom="small">
        Specify correct URL`s to get webhook notifications and check user account.
      </UiText>
      <UiTextField
        v-model="projectLocal.url_process_payment"
        v-bind="$getValidatedFieldProps('projectLocal.url_process_payment')"
        label="Proccess payment URL"
        :autocompleteUrlProtocol="true"
      />
      <UiTextField
        v-model="projectLocal.url_check_account"
        v-bind="$getValidatedFieldProps('projectLocal.url_check_account')"
        label="Check account URL"
        :autocompleteUrlProtocol="true"
      />
    </div>

    <div class="section">
      <UiHeader
        :hasMargin="true"
        level="3"
      >
        Webhook mode
      </UiHeader>

      <UiText indentBottom="small">
        Select <strong>Default</strong> for webhook notifications in you need
        asynchronous notifications and <strong>Pre-approval</strong> if you want
        to validate payment in synchronious mode. In <strong>Pre-approval</strong> mode you
        must implement endpoint for <strong>user.validate</strong> callback.
      </UiText>

      <UiRadio
        v-for="option in modes"
        :matchValue="projectLocal.webhook_mode"
        :key="option.value"
        :value="option.value"
        @change="projectLocal = { ...projectLocal, webhook_mode: $event }"
      >
        {{ option.label }}
      </UiRadio>
    </div>

    <div class="section">
      <UiHeader
        :hasMargin="true"
        level="3"
      >
        Secret key
      </UiHeader>
      <UiText indentBottom="small">
        Generate a secret key to set up correct integration with
        Pay Super platform.
      </UiText>

      <KeyGenerateField
        v-model="projectLocal.secret_key"
        v-bind="$getValidatedFieldProps('projectLocal.secret_key')"
        label="Secret key"
      />
    </div>

    <div class="controls">
      <UiSwitchBox v-model="isWebhooksEnabled">
        Enable webhooks
      </UiSwitchBox>
      <UiButton
        class="submit-button"
        text="SAVE"
        @click="saveProject"
      />
    </div>
  </UiPanel>

  <template v-if="project.url_process_payment">
    <UiPanel>
      <UiTabs
        v-model="currentTabIndex"
        :items="tabs"
      />
      <div class="tab-content">
        <KeepAlive>
          <component
            :is="tabsComponents[tabs[currentTabIndex].value]"
            @input="handleTest"
          />
        </KeepAlive>
      </div>
    </UiPanel>

    <UiPanel v-if="results">
      <WebhookTestResult
        v-for="(result, index) in results"
        :key="index"
        :result="result"
      />
    </UiPanel>
  </template>
</div>
</template>


<style lang="scss" scoped>
.blocks {
  display: flex;
}
.block {
  display: flex;
  width: 50%;
  align-items: center;
  box-sizing: border-box;

  & + & {
    padding-left: 20px;
  }

  & > * {
    flex-shrink: 0;
  }
}
.block-content {
  padding-left: 18px;
}
.block-value {
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: 0.15px;
  color: #000000;
}
.block-label {
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.4px;
  color: #5e6366;
}
.section {
  margin-bottom: 32px;
}
.tab-content {
  margin-top: 32px;
}
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
