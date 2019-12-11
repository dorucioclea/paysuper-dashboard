import axios from 'axios';
import {
  get,
  groupBy,
  map,
  includes,
  union,
  upperFirst,
} from 'lodash-es';
import qs from 'qs';
import getCountriesByRegion from '@/helpers/getCountriesByRegion';
import getIconByPaymentMethod from '@/helpers/getIconByPaymentMethod';
import formatNumber from '@/helpers/formatNumber';
import i18n from '@/plugins/i18n';

function preparePayerRegion(data) {
  let amounts = [];
  const channelCosts = groupBy(
    map(data, item => ({
      method: upperFirst(item.method_name),
      icon: getIconByPaymentMethod(item.method_name),
      methodFee: (item.method_percent_fee * 100).toFixed(2),
      fixedFee: item.method_fixed_fee.toFixed(2),
      overallFee: (item.ps_percent_fee * 100).toFixed(2),
      psGeneralFixedFee: item.ps_fixed_fee.toFixed(2),
      min: item.min_amount,
      max: item.max_amount,
    })),
    (item) => {
      const amount = `${formatNumber(item.min, i18n.locale)} - ${formatNumber(item.max, i18n.locale)}`;
      amounts = union(amounts, [amount]);
      return amount;
    },
  );

  return { amounts, channelCosts };
}

export default function createTariffStore() {
  return {
    namespaced: true,
    state: {
      amount: '0.00 - 4.99',
      amounts: [],
      currency: 'USD',
      payerRegion: 'europe',
      region: 'europe',
      regions: [],
      operationsType: 'low-risk',
      refund: {},
      chargeback: [],
      payout: {},
      minimalPayout: {},
    },
    getters: {},
    mutations: {
      amount(state, data) {
        state.amount = data;
      },
      amounts(state, data) {
        state.amounts = data;
      },
      payerRegion(state, data) {
        state.payerRegion = data;
      },
      region(state, data) {
        state.region = data;
      },
      regions(state, data) {
        state.regions = data;
      },
      operationsType(state, data) {
        state.operationsType = data;
      },
      refund(state, data) {
        state.refund = data;
      },
      chargeback(state, data) {
        state.chargeback = data;
      },
      payout(state, data) {
        state.payout = data;
      },
      minimalPayout(state, data) {
        state.minimalPayout = data;
      },
    },
    actions: {
      async initState({ dispatch }) {
        await dispatch('fetchTariffs');
      },
      async fetchTariffs({ commit, state }) {
        const { payerRegion, region } = state;
        const queryString = qs.stringify({
          region,
          payer_region: payerRegion,
          merchant_operations_type: state.operationsType,
        });

        const response = await axios.get(
          `{apiUrl}/admin/api/v1/merchants/tariffs?${queryString}`,
        );

        if (response.data) {
          const { payment, chargeback, payout } = response.data;
          const { amounts, channelCosts } = preparePayerRegion(payment);
          const minimalPayout = response.data.minimal_payout;

          commit('chargeback', chargeback);
          commit('payout', payout);
          commit('minimalPayout', minimalPayout);

          if (amounts && amounts.length) {
            commit('amounts', amounts);

            if (!includes(amounts, state.amount)) {
              commit('amount', amounts[0]);
            }
          }
          commit('regions', {
            ...state.regions,
            [region]: {
              countries: getCountriesByRegion(region),
              payerRegions: {
                ...get(state.regions, `${region}.payerRegions`, {}),
                [payerRegion]: channelCosts,
              },
              chargeback: {
                fee: chargeback.method_fixed_fee,
                currency: chargeback.method_fixed_fee_currency,
                payoutParty: chargeback.is_paid_by_merchant ? 'Merchant' : 'PaySuper',
              },
              payout: {
                fee: payout.method_fixed_fee,
                currency: payout.method_fixed_fee_currency,
                payoutParty: payout.is_paid_by_merchant ? 'Merchant' : 'PaySuper',
              },
            },
          });
        }
      },
      async submitTariffs({ dispatch, state }) {
        const response = await axios.post(
          '{apiUrl}/admin/api/v1/merchants/tariffs',
          {
            home_region: state.region,
            merchant_operations_type: state.operationsType,
          },
        );

        if (response.status === 200) {
          dispatch('User/Merchant/completeStep', 'tariff', { root: true });
          dispatch('User/Merchant/updateStatus', 7, { root: true });
          dispatch('Company/LicenseAgreement/watchForChangeStatus', true, { root: true });
          return true;
        }

        return false;
      },
      updatePayerRegion({ commit, dispatch }, region) {
        commit('payerRegion', region);
        dispatch('fetchTariffs');
      },
      updateRegion({ commit, dispatch, state }, region) {
        commit('region', region);

        if (get(state.regions, `${region}.payerRegions.${state.payerRegion}`, null)) {
          return;
        }

        dispatch('fetchTariffs');
      },
      updateAmount({ commit }, amount) {
        commit('amount', amount);
      },
      updateOperationsType({ commit, dispatch }, operationsType) {
        commit('operationsType', operationsType);

        dispatch('fetchTariffs');
      },
    },
  };
}
