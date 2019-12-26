import axios from 'axios';

export default function createTransactionPageStore() {
  return {
    state: {
      transaction: null,
      transactionId: null,
    },

    mutations: {
      transactionId(state, data) {
        state.transactionId = data;
      },
      transaction(state, data) {
        state.transaction = data;
      },
    },

    actions: {
      async initState({ dispatch, commit }, { transactionId }) {
        commit('transactionId', transactionId);
        await dispatch('fetchTransactionData');
      },

      async fetchTransactionData({ commit, state }) {
        const response = await axios.get(`{apiUrl}/admin/api/v1/order/${state.transactionId}`);
        commit('transaction', response.data);
      },

      async refund({ rootState, commit, state }, { reason }) {
        const data = {
          reason,
          creator_id: rootState.User.Merchant.merchant.id,
          amount: state.transaction.order_charge.amount,
        };
        const response = await axios.post(
          `{apiUrl}/admin/api/v1/order/${state.transactionId}/refunds`,
          data,
        );
        if (response.data) {
          commit('transaction', {
            ...state.transaction,
            refund_allowed: false,
          });
        }
      },
    },

    namespaced: true,
  };
}
