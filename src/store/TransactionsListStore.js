import axios from 'axios';
import qs from 'qs';
import SearchBuilder from '@/tools/SearchBuilder/SearchBuilder';
import projectTransactionsScheme from '@/schemes/projectTransactionsScheme';

const searchBuilder = new SearchBuilder(projectTransactionsScheme);

export default function createTransactionsListStore() {
  return {
    state: () => ({
      transactionsList: {
        items: [],
        count: 0,
      },
      filterValues: {},
      query: {},
      apiQuery: {},
      currentItem: {},
    }),

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
        const transactionsList = {
          ...response.data,
          items: response.data.items || [],
        };
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

      refund({ rootState }, { transaction, reason }) {
        const data = {
          reason,
          creator_id: rootState.User.Merchant.merchant.id,
          amount: transaction.total_payment_amount,
        };
        return axios.post(
          `${rootState.config.apiUrl}/admin/api/v1/order/${transaction.uuid}/refunds`,
          data,
        );
      },
    },

    namespaced: true,
  };
}
