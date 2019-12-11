import axios from 'axios';
import {
  groupBy,
  map,
  sortBy,
  upperFirst,
} from 'lodash-es';
import getIconByPaymentMethod from '@/helpers/getIconByPaymentMethod';

function getRegionAbbr(region) {
  return {
    europe: 'EU',
    russia_and_cis: 'RU & CIS',
    asia: 'Asia',
    latin_america: 'LA',
    worldwide: 'WW',
  }[region] || region;
}
function getCurrencySymbol(currency) {
  return {
    EUR: '€',
    USD: '$',
    RUB: '₽',
    GBP: '£',
  }[currency] || currency;
}
function prepareChannelCosts(data) {
  return groupBy(
    sortBy(
      map(data, item => ({
        method: upperFirst(item.name),
        icon: getIconByPaymentMethod(item.name),
        methodFee: (item.method_percent * 100).toFixed(2),
        fixedFee: item.method_fix_amount,
        fixedFeeCurrency: getCurrencySymbol(item.method_fix_amount_currency),
        overallFee: (item.ps_percent * 100).toFixed(2),
        psGeneralFixedFee: item.ps_fixed_fee,
        psGeneralFixedFeeCurrency: getCurrencySymbol(item.ps_fixed_fee_currency),
        payoutCurrency: getCurrencySymbol(item.payout_currency),
        amount: item.min_amount,
        country: item.country,
        region: getRegionAbbr(item.region),
      })),
      ['amount', 'region', 'country'],
    ),
    'method',
  );
}
function prepareMoneyBack(data) {
  const moneyBack = groupBy(
    sortBy(
      map(data, item => ({
        method: upperFirst(item.name),
        icon: getIconByPaymentMethod(item.name),
        methodFee: (item.percent * 100),
        fixedFee: item.fix_amount,
        fixedFeeCurrency: getCurrencySymbol(item.fix_amount_currency),
        payoutCurrency: getCurrencySymbol(item.payout_currency),
        payoutParty: item.is_paid_by_merchant ? 'Merchant' : 'PaySuper',
        country: item.country,
        region: getRegionAbbr(item.region),
        type: item.undo_reason,
      })),
      ['method', 'region', 'country'],
    ),
    'type',
  );

  return {
    chargeback: moneyBack.chargeback,
    refundCosts: groupBy(moneyBack.reversal, 'method'),
  };
}

export default function createMerchantTariffStore() {
  return {
    namespaced: true,
    state: {
      channelCosts: {},
      chargeback: [],
      refundCosts: {},
    },
    getters: {},
    mutations: {
      channelCosts(state, data) {
        state.channelCosts = data;
      },
      chargeback(state, data) {
        state.chargeback = data;
      },
      refundCosts(state, data) {
        state.refundCosts = data;
      },
    },
    actions: {
      async initState({ dispatch }, merchantId) {
        await Promise.all([
          dispatch('fetchChannelCosts', merchantId),
          dispatch('fetchMoneyBack', merchantId),
        ]);
      },
      async fetchChannelCosts({ commit }, merchantId) {
        const response = await axios.get(
          `{apiUrl}/system/api/v1/payment_costs/channel/merchant/${merchantId}/all`,
        );

        if (response.data) {
          const { items = [] } = response.data;
          const channelCosts = prepareChannelCosts(items);

          commit('channelCosts', channelCosts);
        }
      },
      async fetchMoneyBack({ commit }, merchantId) {
        const response = await axios.get(
          `{apiUrl}/system/api/v1/payment_costs/money_back/merchant/${merchantId}/all`,
        );

        if (response.data) {
          const { items = [] } = response.data;
          const { chargeback, refundCosts } = prepareMoneyBack(items);

          commit('chargeback', chargeback);
          commit('refundCosts', refundCosts);
        }
      },
    },
  };
}
