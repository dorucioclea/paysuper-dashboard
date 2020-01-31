<script>
export default {
  name: 'WebhookTestResult',
  props: {
    result: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      tabs: [
        { label: 'Request', value: 0 },
        { label: 'Response', value: 1 },
      ],
      currentTab: 0,
      text: {
        non_existing_user: {
          title: 'User verification: Testing response to non-existent user',
          sub: `
            When PaySuper requests to check a non-existent user, the project must respond
            with HTTP code 4xx and error code INVALID_USER. This tester requests to check
            a user with a randomly generated ID.
          `,
        },
        existing_user: {
          title: 'User verification: Testing response to correct user check',
          sub: `
            When PaySuper requests to check an existing user,
            the project must respond with HTTP code 200.
          `,
        },
        correct_payment: {
          title: 'Payment validation: Testing response to correct payment',
          sub: `
            When PaySuper requests a payment with correct parameters,
            the project must respond with HTTP code 200. This tester requests
            to make a payment to an existing user.
          `,
        },
        invalid_signature: {
          title: 'Payment validation: Testing response to invalid signature',
          sub: `
            When PaySuper requests to make a payment with an incorrect signature,
            the project must respond with an HTTP code 4xx and the error code INVALID_SIGNATURE.
          `,
        },
      },
    };
  },
  computed: {
    params() {
      return JSON.parse(this.result.config.data);
    },
    testCase() {
      return this.params.testing_case;
    },
    success() {
      return this.result.status === 200;
    },
  },
};
</script>

<template>
  <div class="result">
    <header class="header">
      <UiHeader level="3">
        {{ text[testCase].title }}
      </UiHeader>
      <div :class="['status', { '_passed': success, '_fail': !success }]">
        <IconPassed class="passed" />
        <IconFail class="fail" />
        <span>{{ result.status }}</span>
      </div>

      <p>{{ text[testCase].sub }}</p>
    </header>

    <div class="content">
      <UiTabs
        v-model="currentTab"
        :items="tabs"
      />
      <div
        v-if="currentTab === 0"
        class="tab"
      >
        <UiTable>
          <UiTableRow v-for="(key, index) in Object.keys(result.config.headers)" :key="index">
            <UiTableCell
              align="right"
              valign="top"
              width="160px"
              class="cell _header"
            >
              {{ key }}
            </UiTableCell>
            <UiTableCell align="left" valign="top" width="510px" class="cell">
              <div class="wrap">
                {{ result.config.headers[key] }}
              </div>
            </UiTableCell>
          </UiTableRow>
        </UiTable>

        <div class="tab-data">
          {{ result.config.data }}
        </div>
      </div>
      <div class="tab" v-if="currentTab === 1">
        <UiTable>
          <UiTableRow v-for="(key, index) in Object.keys(result.headers)" :key="index">
            <UiTableCell
              align="right"
              valign="top"
              width="160px"
              class="cell _header"
            >
              {{ key }}
            </UiTableCell>
            <UiTableCell align="left" valign="top" width="510px" class="cell">
              <div class="wrap">
                {{ result.headers[key] }}
              </div>
            </UiTableCell>
          </UiTableRow>
        </UiTable>

        <div class="tab-data">
          {{ result.data }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.result {
  border: 1px solid #F1F3F4;
  margin-bottom: 24px;
}
.header {
  background: #F7F9FA;
  padding: 27px 25px;
  color: #5E6366;
}
.content {
  padding: 12px 25px 25px;
}
.status {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  margin: 2px 0 9px;

  svg {
    margin-right: 8px;
    position: relative;
    top: -1px;
  }
  &._passed {
    color: #2FA84F;

    .fail {
      display: none;
    }
  }
  &._fail {
    color: #EA3D2F;

    .passed {
      display: none;
    }
  }
}
.cell {
  border-bottom: none;
  font-size: 14px;

  &._header {
    color: #919699;
    padding-right: 24px;
  }
}
.tab {
  padding-top: 24px;
}
.tab-data {
  padding: 14px 16px 16px;
  background: #F7F9FA;
  color: #5E6366;
  font-size: 14px;
  line-height: 20px;
}
.wrap {
  max-width: 510px;
  word-wrap: break-word;
  white-space: normal;
}
</style>
