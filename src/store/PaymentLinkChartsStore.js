import axios from 'axios';
import qs from 'qs';
import SearchBuilder from '@/tools/SearchBuilder/SearchBuilder';
import paymentLinkChartsFilterScheme from '@/schemes/paymentLinkChartsFilterScheme';
import { timeShiftByPeriod, timePeriod } from '@/helpers/timeShiftByPeriod';

const searchBuilder = new SearchBuilder(paymentLinkChartsFilterScheme);

function getDefaultPeriod(type) {
  return {
    main: 'current_month',
  }[type];
}

export default function createPaymentLinkChartsStore() {
  return {
    state: {
      date: null,
      base: null,
      country: null,
      summary: null,
      referrer: null,
      utm: null,
      transactions: null,
      currency: 'USD',
      mainPeriod: getDefaultPeriod('main'),
      lastPayments: [],
      filterValues: {},
      query: {},
      apiQuery: {},
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

      getFilterValues(state) {
        return filterNames => searchBuilder.getFilterValues({
          filterNames,
          query: state.query,
        });
      },

      getEmptyFilterValues() {
        return filterNames => searchBuilder.getEmptyFilterValues({
          filterNames,
        });
      },
    },
    actions: {
      async initState({ commit, dispatch, getters }, { query, linkId }) {
        const mainStoragePeriod = localStorage ? localStorage.getItem('PAYMENT_LINK_MAIN_PERIOD') : null;
        const mainPeriod = JSON.parse(mainStoragePeriod) || getDefaultPeriod('main');

        const filters = getters.getFilterValues();
        dispatch('submitFilters', filters);
        dispatch('initQuery', query);

        commit('mainPeriod', mainPeriod);

        if (linkId === 'new') {
          return;
        }

        await Promise.all([
          dispatch('fetchChart', 'summary'),
          dispatch('fetchChart', 'country'),
          dispatch('fetchChart', 'referrer'),
          dispatch('fetchChart', 'date'),
          dispatch('fetchChart', 'utm'),
          dispatch('fetchChart', 'transactions'),
        ]);
      },
      async fetchChart({
        commit,
        state,
        rootState,
      }, type) {
        const Id = rootState.PaymentLink.linkId;

        if (!Id) {
          return;
        }

        const { apiUrl } = rootState.config;
        const period = state.mainPeriod;
        const query = qs.stringify({
          dateFrom: period.min,
          dateTo: period.max,
        }, { arrayFormat: 'brackets' });
        const path = type !== 'transactions'
          ? `${apiUrl}/admin/api/v1/paylinks/${Id}/dashboard/${type}?${query}`
          : `${apiUrl}/admin/api/v1/paylinks/${Id}/${type}`;

        const response = await axios.get(path);

        if (response.data && response.data.top && response.data.top !== null) {
          commit(type, response.data);
        }
      },
      async changePeriod({ commit, dispatch }, { period }) {
        commit('mainPeriod', period);

        await Promise.all([
          dispatch('fetchChart', 'summary'),
          dispatch('fetchChart', 'country'),
          dispatch('fetchChart', 'referrer'),
          dispatch('fetchChart', 'date'),
          dispatch('fetchChart', 'utm'),
          dispatch('fetchChart', 'transactions'),
        ]);

        localStorage.setItem('main_PERIOD', JSON.stringify(period));
      },

      initQuery({ commit }, query) {
        commit('query', query);

        const apiQuery = searchBuilder.getApiQueryFromQuery(query);
        commit('apiQuery', apiQuery);
      },

      submitFilters({ state, commit }, filters) {
        const newFilters = {
          ...state.filterValues,
          ...filters,
        };
        commit('filterValues', newFilters);

        const apiQuery = searchBuilder.getApiQueryFromFilterValues(newFilters);
        commit('apiQuery', apiQuery);

        const query = searchBuilder.getQueryFromFilterValues(newFilters);
        commit('query', query);
      },
    },
    mutations: {
      date(state, data) {
        state.date = data;
      },
      country(state, data) {
        state.country = data;
      },
      referrer(state, data) {
        state.referrer = data;
      },
      utm(state, data) {
        state.utm = data;
      },
      summary(state, data) {
        state.summary = data;
      },
      transactions(state, data) {
        state.transactions = data;
      },
      mainPeriod(state, data) {
        state.mainPeriod = data;
      },
      filterValues(store, value) {
        store.filterValues = value;
      },
      query(store, value) {
        store.query = value;
      },
      apiQuery(store, value) {
        store.apiQuery = value;
      },
    },
    namespaced: true,
  };
}
