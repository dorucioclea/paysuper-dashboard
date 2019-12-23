import axios from 'axios';
import qs from 'qs';
import SearchBuilder from '@/tools/SearchBuilder/SearchBuilder';
import paymentLinksFilterScheme from '@/schemes/paymentLinksFilterScheme';

const searchBuilder = new SearchBuilder(paymentLinksFilterScheme);

export default function createPaymentLinksListStore() {
  return {
    state: () => ({
      linksList: {
        items: [],
        count: 0,
      },
      balance: {},
      filterValues: {},
      query: {},
      apiQuery: {},
      currentLink: {},
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
      linksList(store, data) {
        store.linksList = data;
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
        // const filters = getters.getFilterValues();
        // dispatch('submitFilters', filters);
        dispatch('initQuery', query);
        await dispatch('fetchLinks');
      },

      async fetchLinks({ state, commit, rootState }) {
        const query = qs.stringify({
          ...state.apiQuery,
        }, { arrayFormat: 'brackets' });
        const url = `${rootState.config.apiUrl}/admin/api/v1/paylinks?${query}`;

        const response = await axios.get(url);
        const linksList = {
          ...response.data,
          items: response.data.items || [],
        };
        // append mode for infinite scroll
        if (state.apiQuery.offset > 0 && linksList.count === state.linkssList.count) {
          linksList.items = [
            ...state.linksList.items,
            ...linksList.items,
          ];
        }
        commit('linksList', linksList);
      },

      initQuery({ commit }, query) {
        commit('query', query);

        const apiQuery = searchBuilder.getApiQueryFromQuery(query);
        commit('apiQuery', apiQuery);
      },

      async deleteLink({ rootState, dispatch }, id) {
        const response = await axios.delete(`${rootState.config.apiUrl}/admin/api/v1/paylinks/${id}`);
        if (response) {
          await dispatch('fetchLinks');
        }
      },
    },

    namespaced: true,
  };
}
