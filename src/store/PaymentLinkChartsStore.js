import axios from 'axios';
import qs from 'qs';
import {
  getTime,
  getDaysInMonth,
  getDaysInYear,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
} from 'date-fns';
import SearchBuilder from '@/tools/SearchBuilder/SearchBuilder';
import paymentLinkChartsFilterScheme from '@/schemes/paymentLinkChartsFilterScheme';

const searchBuilder = new SearchBuilder(paymentLinkChartsFilterScheme);

function getDefaultPeriod(type) {
  return {
    main: 'current_month',
  }[type];
}

function timeShiftByPeriod(period) {
  const hour = 3600000;
  const day = hour * 24;
  const threeDays = day * 3;
  const week = day * 7;
  const month = day * 30;

  return {
    // One hour
    current_day: hour * 6,
    previous_day: hour * 6,
    // 8 hours
    current_week: day,
    previous_week: day,
    // One day
    current_month: threeDays,
    previous_month: threeDays,
    // three days
    current_quarter: week,
    previous_quarter: week,
    // half of month
    current_year: month,
    previous_year: month,
  }[period];
}

function timePeriod(period) {
  const now = getTime(new Date());
  const day = 86400000;
  const week = day * 7;
  const month = day * getDaysInMonth(now);
  const quarter = day * 91;
  const year = day * getDaysInYear(now);

  return {
    current_day: [getTime(startOfDay(now)), now],
    previous_day: [getTime(startOfDay(now - day)), getTime(endOfDay(now - day))],
    current_week: [getTime(startOfWeek(now)), now],
    previous_week: [getTime(startOfWeek(now - week)), getTime(endOfWeek(now - week))],
    current_month: [getTime(startOfMonth(now)), now],
    previous_month: [getTime(startOfMonth(now - month)), getTime(endOfMonth(now - month))],
    current_quarter: [getTime(startOfQuarter(now)), now],
    previous_quarter: [
      getTime(startOfQuarter(now - quarter)),
      getTime(endOfQuarter(now - quarter)),
    ],
    current_year: [getTime(startOfYear(now)), now],
    previous_year: [getTime(startOfYear(now - year)), getTime(endOfYear(now - year))],
  }[period];
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
