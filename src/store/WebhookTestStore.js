import axios from 'axios';
import { map } from 'lodash-es';
import Centrifuge from 'centrifuge';

const CASES = ['existing_user', 'non_existing_user', 'correct_payment', 'invalid_signature'];

export default function createWebhookTestStore() {
  return {
    namespaced: true,
    state: {
      projectId: null,
      virtualItems: null,
      keys: null,
      isWatchingInited: false,
      results: null,
    },
    mutations: {
      projectId(state, data) {
        state.projectId = data;
      },
      virtualItems(state, data) {
        state.virtualItems = data;
      },
      keys(state, data) {
        state.keys = data;
      },
      isWatchingInited(state, data) {
        state.isWatchingInited = data;
      },
      results(state, data) {
        state.results = data;
      },
    },
    getters: {
      virtualItemsList(state) {
        return state.virtualItems.items.map(item => ({ label: item.name.en, value: item.id }));
      },
      keysList(state) {
        return state.keys.products.map(item => ({ label: item.name.en, value: item.id }));
      },
    },
    actions: {
      async initState({ commit, dispatch }, projectId) {
        commit('projectId', projectId);
        dispatch('fetchVirtualItems');
        dispatch('fetchKeys');
      },
      async sendTestWebhook({ dispatch, state }, testData) {
        const { projectId } = state;
        const webhookTestUrl = `{apiUrl}/admin/api/v1/projects/${projectId}/webhook/testing`;
        const tests = map(CASES, testCase => axios.post(webhookTestUrl, {
          type: testData.type,
          testing_case: testCase,
          user: { external_id: testData.userId },
          order_id: testData.transactionId,
          amount: parseInt(testData.amount, 10) || undefined,
          currency: testData.currency,
          project: projectId,
          products: testData.products,
        }));
        dispatch('watchForTests');
        await Promise.all(tests).catch(console.warn);
      },
      async fetchVirtualItems({ commit }) {
        const response = await axios.get('{apiUrl}/admin/api/v1/products?limit=100');
        commit('virtualItems', response.data);
      },
      async fetchKeys({ commit }) {
        const response = await axios.get('{apiUrl}/admin/api/v1/key-products');
        commit('keys', response.data);
      },
      watchForTests({ state, commit, rootState }) {
        if (state.isWatchingInited) {
          return;
        }
        const centrifuge = new Centrifuge(rootState.config.websocketUrl);
        const { merchant } = rootState.User.Merchant;

        centrifuge.setToken(merchant.centrifugo_token);
        centrifuge.subscribe(`paysuper:merchant:order_testing#${merchant.id}`, async ({ data }) => {
          commit('results', data);
        });
        centrifuge.connect();
        commit('isWatchingInited', true);
      },
    },
  };
}
