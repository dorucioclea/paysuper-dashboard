import axios from 'axios/index';
import Centrifuge from 'centrifuge';
import { saveAs } from 'file-saver';
import { once } from 'lodash-es';

function getUrl(params) {
  const urls = {
    payout: `{apiUrl}/admin/api/v1/payout_documents/${params.params.id}/download`,
    royalty: `{apiUrl}/admin/api/v1/royalty_reports/${params.params.id}/download`,
    royalty_transactions: `{apiUrl}/admin/api/v1/royalty_reports/${params.params.id}/transactions/download`,
    vat: `{apiUrl}/system/api/v1/vat_reports/details/${params.params.id}/download`,
    transactions: '{apiUrl}/admin/api/v1/order/download',
  };

  return urls[params.report_type];
}

export default function exportFile() {
  return {
    state: {
      extension: null,
    },

    mutations: {
      extension(state, data) {
        state.extension = data;
      },
    },

    actions: {
      /**
      * Create report file
      * @param commit
      * @param dispatch
      * @param params {Object} - {
      *   file_type, // (csv, pdf, xlsx)
      *   report_type, // vat, vat_transactions, royalty,
      *                // royalty_transactions, payout, transactions
      *   params: {
      *     id // (document id)
      *   }
      * }
      * @returns {Promise<void>}
      */
      async createReportFile({ commit, dispatch }, params) {
        commit('extension', params.file_type);
        await axios.post(getUrl(params), {
          file_type: params.file_type,
          ...params.params,
        });

        dispatch('initWaitingFile');
      },

      initWaitingFile: once(({ rootState, state }) => {
        const centrifuge = new Centrifuge(rootState.config.websocketUrl);
        centrifuge.setToken(rootState.User.Merchant.merchant.centrifugo_token);
        centrifuge.subscribe(`paysuper:user#${rootState.User.Merchant.merchant.id}`, ({ data }) => {
          axios.get(`{apiUrl}/auth/api/v1/report_file/download/${data.file_name}`, {
            headers: { Accept: `application/${state.extension}` },
            responseType: 'blob',
          })
            .then((response) => {
              saveAs(
                new Blob([response.data], { type: `application/${state.extension}` }),
                data.file_name,
              );
            });
        });
        centrifuge.connect();
      }),
    },

    namespaced: true,
  };
}
