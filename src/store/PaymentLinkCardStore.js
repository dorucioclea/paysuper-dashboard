import axios from 'axios';
import qs from 'qs';
import assert from 'simple-assert';
import { get } from 'lodash-es';

export default function createPaymentLinkCard() {
  return {
    state: {
      apiQuery: {},
      productsList: [],
      projectsList: [],
      linkItem: null,
      linkUrl: null,
      linkId: null,
      currency: 'USD',
    },

    mutations: {
      apiQuery(store, value) {
        store.apiQuery = value;
      },
      productsList(store, data) {
        store.productsList = data;
      },
      projectsList(store, data) {
        store.projectsList = data;
      },
      linkId(state, data) {
        state.linkId = data;
      },
      linkItem(state, data) {
        state.linkItem = data;
      },
      linkItemUrl(state, data) {
        state.linkItemUrl = data;
      },
      currency(state, data) {
        state.currency = data;
      },
    },

    actions: {
      async initState({ commit, dispatch, state }, { linkId }) {
        assert(linkId, 'PaymentLinkCardStore requires linkId param');
        commit('linkId', linkId);
        if (linkId !== 'new') {
          await dispatch('fetchLinkData', linkId);

          if (get(state.linkItem, 'is_expired') !== true) {
            await dispatch('fetchLinkUrl');
          }
        } else {
          commit('linkItem', {});
        }

        await dispatch('fetchProjects');
      },

      async fetchLinkData({ commit, dispatch, rootState }, id) {
        const response = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/paylinks/${id}`);
        const { products } = response.data;
        commit('linkItem', response.data);

        if (response.data.default_currency && response.data.default_currency !== '') {
          commit('currency', response.data.default_currency);
        } else {
          commit('currency', 'USD');
        }
        await dispatch('fetchLinkProducts', products);
      },

      async fetchLinkProducts({ commit, dispatch }, products) {
        commit('productsList', []);
        await products.forEach((product) => {
          dispatch('fetchProductById', product);
        });
      },

      async fetchProductById({ rootState, state, commit }, id) {
        const isKey = state.linkItem.products_type === 'key';
        const type = isKey ? 'key-products' : 'products';
        const response = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/${type}/${id}`);
        let d = null;

        if (isKey) {
          d = response.data;
        } else {
          d = response.data.item;
        }

        const virtualItems = [
          ...state.productsList,
          d,
        ];
        commit('productsList', virtualItems);
      },

      async fetchLinkUrl({ commit, rootState, state }) {
        const id = state.linkId;
        const response = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/paylinks/${id}/url`);
        commit('linkItemUrl', response.data);
      },

      async fetchProducts({ state, commit, rootState }, { projectId, type }) {
        const query = qs.stringify({
          ...state.apiQuery,
          project_id: projectId,
          limit: 30,
        }, { arrayFormat: 'brackets' });
        const url = `${rootState.config.apiUrl}/admin/api/v1/${type}?${query}`;

        const response = await axios.get(url);
        const path = type === 'key-products' ? 'products' : 'items';
        const virtualItems = {
          items: response.data[path] || [],
        };
        commit('productsList', virtualItems);
      },

      async createItem({ rootState }, data) {
        await axios.post(`${rootState.config.apiUrl}/admin/api/v1/paylinks`, data);
      },

      async editItem({ rootState, state }, data) {
        if (!state.linkId) {
          return;
        }
        await axios.put(`${rootState.config.apiUrl}/admin/api/v1/paylinks/${state.linkId}`, {
          ...data,
          id: state.linkId,
        });
      },

      async fetchProjects({ state, commit, rootState }) {
        const query = qs.stringify({
          ...state.apiQuery,
          merchant_id: rootState.User.Merchant.merchant.id,
        }, { arrayFormat: 'brackets' });

        const { data } = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/projects?${query}`);
        commit('projectsList', data);
      },
    },

    namespaced: true,
  };
}
