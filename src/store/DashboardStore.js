import axios from 'axios';
import qs from 'qs';
import { camelCase, get, upperCase } from 'lodash-es';
import { timeShiftByPeriod, timePeriod } from '@/helpers/timeShiftByPeriod';

function getDefaultPeriod(type) {
  return {
    base: 'current_month',
    main: 'current_month',
  }[type];
}

export default function createContactsStore() {
  return {
    namespaced: true,
    state: {
      base: null,
      main: null,
      revenue: null,
      currency: 'USD',
      basePeriod: getDefaultPeriod('base'),
      mainPeriod: getDefaultPeriod('main'),
      lastPayments: [],
    },
    getters: {
      mainChartPeriod(state) {
        const timeShift = timeShiftByPeriod(state.mainPeriod);
        const period = timePeriod(state.mainPeriod);

        return {
          min: period[0] - timeShift,
          max: period[1] + timeShift,
        };
      },
      baseChartPeriod(state) {
        const timeShift = timeShiftByPeriod(state.basePeriod);
        const period = timePeriod(state.basePeriod);

        return {
          min: period[0] - timeShift,
          max: period[1] + timeShift,
        };
      },
    },
    actions: {
      async initState({ commit, dispatch }) {
        const baseStoragePeriod = localStorage ? localStorage.getItem('BASE_PERIOD') : null;
        const basePeriod = JSON.parse(baseStoragePeriod) || getDefaultPeriod('base');

        const mainStoragePeriod = localStorage ? localStorage.getItem('MAIN_PERIOD') : null;
        const mainPeriod = JSON.parse(mainStoragePeriod) || getDefaultPeriod('main');

        commit('basePeriod', basePeriod);
        commit('mainPeriod', mainPeriod);

        await dispatch('fetchChart', 'main');
        await dispatch('fetchChart', 'revenue_dynamics');
        await dispatch('fetchChart', 'base');
        await dispatch('fetchLastPayments');
      },
      async fetchChart({
        commit,
        state,
        rootState,
        rootGetters,
      }, type) {
        const isOnboardingComplete = rootGetters['User/Merchant/isOnboardingComplete'];
        const { Merchant } = rootState.User;
        const merchantId = Merchant.merchant.id;

        if (!merchantId || !isOnboardingComplete) {
          return;
        }

        const { apiUrl } = rootState.config;
        const period = state[`${type}Period`] || state.mainPeriod;
        const queryString = qs.stringify({ period });

        const response = await axios.get(
          `${apiUrl}/admin/api/v1/merchants/dashboard/${type}?${queryString}`,
        );

        if (response.data) {
          commit(camelCase(type), response.data);
        }
      },
      async changePeriod({ commit, dispatch }, { type, period }) {
        commit(`${type}Period`, period);

        if (type === 'base') {
          await dispatch('fetchChart', 'base');
        }
        if (type === 'main') {
          await dispatch('fetchChart', 'main');
          await dispatch('fetchChart', 'revenue_dynamics');
        }

        localStorage.setItem(`${upperCase(type)}_PERIOD`, JSON.stringify(period));
      },
      async fetchLastPayments({ commit, rootState }, count = 30) {
        const { Merchant } = rootState.User;
        const merchantId = Merchant.merchant.id;

        if (!merchantId) {
          return;
        }

        const { apiUrl } = rootState.config;
        const queryString = qs.stringify({
          merchant: [merchantId],
          sort: ['-created_at'],
          limit: count,
        }, { arrayFormat: 'brackets' });

        const response = await axios.get(
          `${apiUrl}/admin/api/v1/order?${queryString}`,
        );

        if (response.data) {
          commit('lastPayments', response.data.items);
        }
      },
    },
    mutations: {
      base(state, data) {
        state.base = data;
      },
      main(state, data) {
        state.main = data;
      },
      revenueDynamics(state, data) {
        const currency = get(data, 'currency');

        state.revenue = get(data, 'items', []);

        if (currency) {
          state.currency = get(data, 'currency');
        }
      },
      basePeriod(state, data) {
        state.basePeriod = data;
      },
      mainPeriod(state, data) {
        state.mainPeriod = data;
      },
      lastPayments(state, data) {
        state.lastPayments = data;
      },
    },
  };
}
