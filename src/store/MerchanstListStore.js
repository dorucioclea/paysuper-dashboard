import axios from 'axios';
import SearchBuilder from '@/tools/SearchBuilder';
import merchantsListScheme from '@/schemes/merchantsListScheme';
import qs from 'qs';

const searchBuilder = new SearchBuilder(merchantsListScheme);

export default function createStore({ config }) {
  return {
    state: () => ({
      merchants: {
        items: [],
        count: 0,
      },
      filterValues: {},
      query: {},
      apiQuery: {},
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
      merchants(store, data) {
        store.merchants = data;
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
      async initState({ dispatch }, { query }) {
        await dispatch('initQuery', query);
      },

      async fetchMerchants({ state, commit, rootState }) {
        const url = `${config.apiUrl}/admin/api/v1/merchants?${qs.stringify(state.apiQuery)}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${rootState.User.accessToken}` },
        });
        commit('merchants', response.data || []);
      },

      async initQuery({ commit, dispatch }, query) {
        commit('query', query);

        const apiQuery = searchBuilder.getApiQueryFromQuery(query);
        commit('apiQuery', apiQuery);

        const filterValues = searchBuilder.getEmptyFilterValues();
        commit('filterValues', filterValues);

        await dispatch('fetchMerchants');
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

    namespaced: true,
  };
}