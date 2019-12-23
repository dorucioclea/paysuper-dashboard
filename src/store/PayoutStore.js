import axios from 'axios';
import qs from 'qs';
import SearchBuilder from '@/tools/SearchBuilder/SearchBuilder';
import projectPayoutsScheme from '@/schemes/payoutsScheme';

const searchBuilder = new SearchBuilder(projectPayoutsScheme);

export default function createPayoutsStore() {
  return {
    state: () => ({
      payoutsList: {
        items: [],
        count: 0,
      },
      filterValues: {},
      query: {},
      apiQuery: {},
      currentItem: {},
      balance: {},
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
      payoutsList(store, data) {
        store.payoutsList = data;
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
      balance(store, value) {
        store.balance = value;
      },
    },

    actions: {
      async initState({ getters, dispatch }, { query }) {
        const filters = getters.getFilterValues();
        dispatch('submitFilters', filters);
        dispatch('initQuery', query);
        await dispatch('fetchPayouts');
        await dispatch('fetchBalance');
      },

      async fetchPayouts({ state, commit }) {
        const query = qs.stringify({
          ...state.apiQuery,
        }, { arrayFormat: 'brackets' });
        const url = `{apiUrl}/admin/api/v1/payout_documents?${query}`;

        const response = await axios.get(url);
        const payoutsList = {
          ...response.data,
          items: response.data.items || [],
        };
        // append mode for infinite scroll
        if (state.apiQuery.offset > 0 && payoutsList.count === state.payoutsList.count) {
          payoutsList.items = [
            ...state.payoutsList.items,
            ...payoutsList.items,
          ];
        }
        commit('payoutsList', payoutsList);
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

      async fetchBalance({ commit }) {
        const { data } = await axios.get('{apiUrl}/admin/api/v1/balance');
        commit('balance', data);
      },

      async createPayout(ctx, description) {
        await axios.post(
          '{apiUrl}/admin/api/v1/payout_documents', { description },
        );
      },
    },

    namespaced: true,
  };
}
