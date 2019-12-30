import axios from 'axios';
import { findKey, get } from 'lodash-es';
import qs from 'qs';
import SearchBuilder from '@/tools/SearchBuilder/SearchBuilder';
import transactionsListScheme from '@/schemes/transactionsListScheme';

const searchBuilder = new SearchBuilder(transactionsListScheme);

export default function createTransactionsListStore() {
  return {
    state: {
      transactionsList: {
        items: [],
        count: 0,
      },
      filterValues: {},
      query: {},
      apiQuery: {},
    },

    getters: {
      getFilterValues(state) {
        return filterNames => searchBuilder.getFilterValues({
          filterNames,
          query: state.query,
          dictionaries: {},
        });
      },

      getEmptyFilterValues() {
        return filterNames => searchBuilder.getEmptyFilterValues({
          filterNames,
        });
      },
    },

    mutations: {
      transactionsList(store, data) {
        store.transactionsList = data;
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

    actions: {
      async initState({ getters, dispatch }, { query }) {
        const filters = getters.getFilterValues();
        dispatch('submitFilters', filters);
        dispatch('initQuery', query);
        await dispatch('fetchTransactions');
      },

      async fetchTransactions({ state, commit, rootState }) {
        const query = qs.stringify({
          ...state.apiQuery,
        }, { arrayFormat: 'brackets' });
        const url = `${rootState.config.apiUrl}/admin/api/v1/order?${query}&sort[]=-created_at`;

        const response = await axios.get(url);
        const items = get(response, 'data.items') || [];
        const count = get(response, 'data.count') || 0;
        const transactionsList = { items, count };

        // append mode for infinite scroll
        if (state.apiQuery.offset > 0 && transactionsList.count === state.transactionsList.count) {
          transactionsList.items = [
            ...state.transactionsList.items,
            ...transactionsList.items,
          ];
        }
        commit('transactionsList', transactionsList);
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

      async refund({ rootState, commit, state }, { transaction, reason }) {
        const data = {
          reason,
          creator_id: rootState.User.Merchant.merchant.id,
          amount: transaction.order_charge.amount,
        };

        const response = await axios.post(
          `{apiUrl}/admin/api/v1/order/${transaction.uuid}/refunds`,
          data,
        );

        if (response.data) {
          const items = [...state.transactionsList.items];
          const transactionIndex = findKey(items, { uuid: transaction.uuid });
          items[transactionIndex] = {
            ...transaction,
            refund_allowed: false,
            status: 'refunded',
          };

          commit('transactionsList', {
            count: state.transactionsList.count,
            items,
          });
        }

        return response;
      },
    },

    namespaced: true,
  };
}
