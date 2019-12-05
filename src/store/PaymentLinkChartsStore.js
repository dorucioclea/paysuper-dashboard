import axios from 'axios';
import qs from 'qs';
import { camelCase, get } from 'lodash-es';
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
      country: null,
      referrer: null,
      utm: null,
      currency: 'USD',
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
    },
    actions: {
      async initState({ commit, dispatch }) {
        const mainStoragePeriod = localStorage ? localStorage.getItem('MAIN_PERIOD') : null;
        const mainPeriod = JSON.parse(mainStoragePeriod) || getDefaultPeriod('main');

        commit('mainPeriod', mainPeriod);

        await dispatch('fetchChart', 'date'); // revenue dynamics
        await dispatch('fetchChart', 'country');
        await dispatch('fetchChart', 'referrer');
        await dispatch('fetchChart', 'utm');
        // await dispatch('fetchLastPayments');
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
        const queryString = qs.stringify({ period });

        const response = await axios.get(
          `${apiUrl}/admin/api/v1/paylinks/${Id}/dashboard/${type}?${queryString}`,
        );

        if (response.data) {
          commit(camelCase(type), response.data);
        }
      },
      async changePeriod({ commit, dispatch }, { period }) {
        commit('mainPeriod', period);

        await dispatch('fetchChart', 'date'); // revenue dynamics
        await dispatch('fetchChart', 'country');
        await dispatch('fetchChart', 'referrer');
        await dispatch('fetchChart', 'utm');

        localStorage.setItem('main_PERIOD', JSON.stringify(period));
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
          `${apiUrl}/admin/api/paylinks/{id}/dashboard/country?${queryString}`,
        );

        if (response.data) {
          commit('lastPayments', response.data.items);
        }
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
      revenueDynamics(state, data) {
        const currency = get(data, 'transactions_currency');

        state.revenue = get(data, 'items', []);

        if (currency) {
          state.currency = get(data, 'currency');
        }
      },
      mainPeriod(state, data) {
        state.mainPeriod = data;
      },
      lastPayments(state, data) {
        state.lastPayments = data;
      },
    },
    namespaced: true,
  };
}
