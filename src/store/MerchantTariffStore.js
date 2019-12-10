import axios from 'axios';
import {
  findIndex,
  groupBy,
  map,
  size,
  sortBy,
  toNumber,
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
        id: item.id,
        mcc: item.mcc_code,
        method: upperFirst(item.name),
        icon: getIconByPaymentMethod(item.name),
        methodFee: (item.method_percent * 100).toFixed(2),
        fixedFee: item.method_fix_amount,
        fixedFeeCurrency: item.method_fix_amount_currency,
        fixedFeeCurrencySymbol: getCurrencySymbol(item.method_fix_amount_currency),
        overallFee: (item.ps_percent * 100).toFixed(2),
        psGeneralFixedFee: item.ps_fixed_fee,
        psGeneralfixedFeeCurrency: item.ps_fixed_fee_currency,
        psGeneralfixedFeeCurrencySymbol: getCurrencySymbol(item.ps_fixed_fee_currency),
        payoutCurrency: item.payout_currency,
        payoutCurrencySymbol: getCurrencySymbol(item.payout_currency),
        amount: item.min_amount,
        region: item.region,
        regionAbbr: getRegionAbbr(item.region),
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
        id: item.id,
        mcc: item.mcc_code,
        method: upperFirst(item.name),
        icon: getIconByPaymentMethod(item.name),
        methodFee: (item.percent * 100),
        fixedFee: item.fix_amount,
        fixedFeeCurrency: item.fix_amount_currency,
        fixedFeeCurrencySymbol: getCurrencySymbol(item.fix_amount_currency),
        payoutCurrency: item.payout_currency,
        payoutCurrencySymbol: getCurrencySymbol(item.payout_currency),
        payoutParty: item.is_paid_by_merchant ? 'Merchant' : 'PaySuper',
        region: item.region,
        regionAbbr: getRegionAbbr(item.region),
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
      merchantId: null,
      refundCosts: {},
      updatedChannelCosts: {},
      updatedChargeback: {},
      updatedRefundCosts: {},
    },
    getters: {
      hasChanged(state) {
        return size(state.updatedChannelCosts) !== 0
          || size(state.updatedChargeback) !== 0
          || size(state.updatedRefundCosts) !== 0;
      },
    },
    mutations: {
      channelCosts(state, data) {
        state.channelCosts = data;
      },
      chargeback(state, data) {
        state.chargeback = data;
      },
      merchantId(state, data) {
        state.merchantId = data;
      },
      refundCosts(state, data) {
        state.refundCosts = data;
      },
      updatedChannelCosts(state, data) {
        state.updatedChannelCosts = data;
      },
      updatedChargeback(state, data) {
        state.updatedChargeback = data;
      },
      updatedRefundCosts(state, data) {
        state.updatedRefundCosts = data;
      },
    },
    actions: {
      async initState({ commit, dispatch }, merchantId) {
        commit('merchantId', merchantId);

        await Promise.all([
          dispatch('fetchChannelCosts'),
          dispatch('fetchMoneyBack'),
        ]);
      },
      async fetchChannelCosts({ commit, state }) {
        const { merchantId } = state;
        const response = await axios.get(
          `{apiUrl}/system/api/v1/payment_costs/channel/merchant/${merchantId}/all`,
        );

        if (response.data) {
          const { items = [] } = response.data;
          const channelCosts = prepareChannelCosts(items);

          commit('channelCosts', channelCosts);
        }
      },
      async fetchMoneyBack({ commit, state }) {
        const { merchantId } = state;
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
      updateChannelCost({ commit, state }, channelCost) {
        const { id, method } = channelCost;
        const channelCostsByMethod = state.channelCosts[method];
        const index = findIndex(channelCostsByMethod, { id });

        channelCostsByMethod[index] = {
          ...state.channelCosts[method][index],
          ...channelCost,
        };

        commit('channelCosts', {
          ...state.channelCosts,
          [method]: channelCostsByMethod,
        });
        commit('updatedChannelCosts', {
          ...state.updatedChannelCosts,
          [id]: {
            name: method,
            payout_currency: channelCost.payoutCurrency,
            min_amount: channelCost.amount,
            region: channelCost.region,
            method_percent: toNumber(channelCost.methodFee),
            method_fix_amount: toNumber(channelCost.fixedFee),
            method_fix_amount_currency: channelCost.fixedFeeCurrency,
            ps_percent: toNumber(channelCost.overallFee),
            ps_fixed_fee: toNumber(channelCost.psGeneralFixedFee),
            ps_fixed_fee_currency: channelCost.psGeneralfixedFeeCurrency,
            mcc_code: channelCost.mcc,
          },
        });
      },
      updateRefundCost({ commit, state }, refundCost) {
        const { id, method } = refundCost;
        const refundCostsByMethod = state.refundCosts[method];
        const index = findIndex(refundCostsByMethod, { id });

        refundCostsByMethod[index] = {
          ...state.refundCosts[method][index],
          ...refundCost,
        };

        commit('refundCosts', {
          ...state.refundCosts,
          [method]: refundCostsByMethod,
        });
        commit('updatedrefundCosts', {
          ...state.updatedrefundCosts,
          [id]: {
            name: method,
            payout_currency: refundCost.payoutCurrency,
            undo_reason: refundCost.type,
            region: refundCost.region,
            percent: toNumber(refundCost.methodFee),
            fix_amount: toNumber(refundCost.fixedFee),
            fix_amount_currency: refundCost.fixedFeeCurrency,
            is_paid_by_merchant: refundCost === 'Merchant',
            mcc_code: refundCost.mcc,
          },
        });
      },
      updateChargeback({ commit, state }, chargeback) {
        const { id, method } = chargeback;
        const index = findIndex(state.chargeback, { id });
        const chargebackArr = state.chargeback;

        chargebackArr[index] = chargeback;

        commit('chargeback', chargebackArr);
        commit('updatedChargeback', {
          ...state.updatedChargeback,
          [id]: {
            name: method,
            payout_currency: chargeback.payoutCurrency,
            undo_reason: chargeback.type,
            region: chargeback.region,
            percent: toNumber(chargeback.methodFee),
            fix_amount: toNumber(chargeback.fixedFee),
            fix_amount_currency: chargeback.fixedFeeCurrency,
            is_paid_by_merchant: chargeback === 'Merchant',
            mcc_code: chargeback.mcc,
          },
        });
      },
      async save({ commit, dispatch }) {
        await Promise.all(
          dispatch('saveChannelCosts'),
          dispatch('saveMoneyBack'),
        );
        commit('updatedChannelCosts', {});
        commit('updatedrefundCosts', {});
        commit('updatedChargeback', {});
      },
      async saveChannelCosts({ state }) {
        const { merchantId, updatedChannelCosts } = state;

        await Promise.all(
          map(updatedChannelCosts, (value, id) => axios.put(
            `{apiUrl}/system/api/v1/payment_costs/channel/merchant/${merchantId}/${id}`,
            value,
          )),
        );
      },
      async saveMoneyBack({ state }) {
        const { merchantId, updatedChargeback, updatedRefundCosts } = state;

        await Promise.all(
          map([...updatedChargeback, ...updatedRefundCosts], (value, id) => axios.put(
            `{apiUrl}/system/api/v1/payment_costs/money_back/merchant/${merchantId}/${id}`,
            value,
          )),
        );
      },
    },
  };
}
