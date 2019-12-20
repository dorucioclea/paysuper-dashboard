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
      setTransaction(state, data) {
        state.transaction = data;
      },
    },

    actions: {
      async initState({ dispatch, commit }, { transactionId }) {
        commit('transactionId', transactionId);
        await dispatch('fetchTransactionData', transactionId);
      },

      async fetchTransactionData({ commit, rootState }, id) {
        const response = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/order/${id}`);
        commit('setTransaction', response.data);
      },

      async refund({ rootState, commit }, { transaction, reason }) {
        const data = {
          reason,
          creator_id: rootState.User.Merchant.merchant.id,
          amount: transaction.order_charge.amount,
        };
        const response = await axios.post(
          `${rootState.config.apiUrl}/admin/api/v1/order/${transaction.uuid}/refunds`,
          data,
        );
        if (response.data) {
          commit('refund', { items: response.data });
        }
      },
    },

    namespaced: true,
  };
}
