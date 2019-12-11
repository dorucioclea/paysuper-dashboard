<script>
import { mapState } from 'vuex';
import assert from 'simple-assert';

export default {
  name: 'DemoShopPage',
  data() {
    return {
      currency: 'USD',
      amount: 30,
    };
  },
  computed: {
    ...mapState(['config']),
  },
  async created() {
    assert(this.config.paysuperJsSdkUrl, 'paysuperJsSdkUrl is not defined');
    const script = document.createElement('script');
    script.src = this.config.paysuperJsSdkUrl;
    document.head.appendChild(script);
  },

  methods: {
    buy(type) {
      let request = {
        project: '5dcd11bc218dc30001d7098f',
        type,
      };

      if (type === 'simple') {
        request = {
          ...request,
          amount: this.amount,
          currency: this.currency,
        };
      }
      if (type === 'product') {
        request = {
          ...request,
          products: ['5dcdb73d218dc30001d73c25', '5dcdb841218dc30001d73c26'],
        };
      }
      if (type === 'key') {
        request = {
          ...request,
          products: ['5dcdb885218dc30001d73c27'],
        };
      }
      const paySuper = new window.PaySuper(request);
      paySuper.renderModal();
    },
  },
};
</script>

<template>
<div class="payment-form-sdk">
  <UiPanel>
    <section class="section">
      <div>
        <UiHeader
          :hasMargin="true"
          level="3"
        >
          Simple checkout
        </UiHeader>
        <div class="row">
          <UiTextField label="Amount" :isNumeric="true" v-model="amount" />
          <UiTextField label="Currency" v-model="currency" />
        </div>
      </div>
      <div class="section-aside">
        <UiButton
          class="button"
          @click="buy('simple')"
        >
          BUY
        </UiButton>
      </div>
    </section>
  </UiPanel>
  <UiPanel>
    <section class="section">
      <div>
        <UiHeader
          :hasMargin="true"
          level="3"
        >
          Virtual items
        </UiHeader>
        <UiText class="text">
          There are 2 demo products to buy
        </UiText>
      </div>
      <div class="section-aside">
        <UiButton
          class="button"
          @click="buy('product')"
        >
          BUY
        </UiButton>
      </div>
    </section>
  </UiPanel>
  <UiPanel>
    <section class="section">
      <div>
        <UiHeader
          :hasMargin="true"
          level="3"
        >
          Game keys
        </UiHeader>
        <UiText class="text">
          There is 1 demo product to buy
        </UiText>
      </div>
      <div class="section-aside">
        <UiButton
          class="button"
          @click="buy('key')"
        >
          BUY
        </UiButton>
      </div>
    </section>
  </UiPanel>
</div>
</template>

<style lang="scss" scoped>
.payment-form-sdk {
  width: 600px;
}
@media screen and (max-width: 640px) {
  .payment-form-sdk {
    width: 300px;
  }
}

.section {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.section-aside {
  display: flex;
  align-items: center;
}
.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & > * {
    width: 48%;
  }
}
</style>
