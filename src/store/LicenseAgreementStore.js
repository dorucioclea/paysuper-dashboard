import axios from 'axios';
import { saveAs } from 'file-saver';
import { delay, get, includes } from 'lodash-es';
import Centrifuge from 'centrifuge';

function getDefaultAgreementDocument() {
  return {
    metadata: {
      name: 'License Agreement',
      extension: 'pdf',
      size: 0,
    },
    url: '#',
  };
}

export default function createLicenseAgreementStore() {
  let centrifuge = null;

  return {
    namespaced: true,
    state: {
      isAgreementLoading: false,
      agreement: getDefaultAgreementDocument(),
    },
    getters: {
      isSigendYou(state, getters) {
        return includes([3, 4], getters.status);
      },
      isSigendPS(state, getters) {
        return getters.status === 4;
      },
      status(state, getter, rootState) {
        return rootState.User.Merchant.merchant.status;
      },
      merchantId(state, getter, rootState) {
        return rootState.User.Merchant.merchant.id;
      },
      centrifugoToken(state, getter, rootState) {
        return rootState.User.Merchant.merchant.centrifugo_token;
      },
      websocketUrl(state, getter, rootState) {
        return rootState.config.websocketUrl;
      },
    },
    mutations: {
      agreement(state, data) {
        state.agreement = data;
      },
      document(state, data) {
        state.document = data;
      },
      isAgreementLoading(state, data) {
        state.isAgreementLoading = data;
      },
    },
    actions: {
      async initState({ dispatch, getters }) {
        dispatch('stopWatchForChangeStatus');

        await dispatch('fetchAgreementMetadata');
        await dispatch('fetchDocument');

        if (includes([3, 7, 8], getters.status)) {
          dispatch('watchForChangeStatus');
        }
      },
      async fetchAgreementMetadata({ commit, dispatch, getters }, retryCount = 0) {
        const { status } = getters;

        if (includes([3, 4, 8], status)) {
          commit('isAgreementLoading', true);
          const response = await dispatch('updateMetadata', retryCount);
          const agreement = get(response, 'data', getDefaultAgreementDocument());

          commit('agreement', agreement);
        }
      },
      async updateMetadata({ dispatch, state }, retryCount) {
        const response = await axios.get('{apiUrl}/admin/api/v1/merchants/agreement');
        const newSize = get(response, 'data.metadata.size', null);
        if (newSize && newSize !== state.agreement.metadata.size) {
          return response;
        }
        if (retryCount) {
          return new Promise(r => setTimeout(r, 3000))
            .then(() => dispatch('updateMetadata', retryCount - 1));
        }
        return response;
      },
      async uploadDocument({ dispatch, state }) {
        const hasDocument = !!state.document || await dispatch('fetchDocument');
        const { extension } = state.agreement.metadata;

        if (hasDocument) {
          saveAs(
            new Blob([state.document], { type: `application/${extension}` }),
            `License Agreement.${extension}`,
          );
        }
      },
      async fetchDocument({ commit, state }) {
        const { url } = state.agreement;
        const { size, extension } = state.agreement.metadata;

        if (url === '#' || size === 0) {
          return false;
        }

        const response = await axios.get(url, {
          headers: { Accept: `application/${extension}` },
          responseType: 'blob',
        });

        if (response.status === 200) {
          commit('document', response.data);
          commit('isAgreementLoading', false);
          return true;
        }

        return false;
      },
      watchForChangeStatus({ dispatch, getters }) {
        const { centrifugoToken, merchantId, websocketUrl } = getters;

        if (centrifuge || !merchantId || !centrifugoToken) {
          return;
        }

        centrifuge = new Centrifuge(websocketUrl);

        centrifuge.setToken(centrifugoToken);
        centrifuge.subscribe(`paysuper:merchant#${merchantId}`, async ({ data }) => {
          const status = get(data, 'statuses.to', null);

          if (status === 6 || status === 8) {
            dispatch('User/Merchant/updateStatus', status, { root: true });
            return;
          }
          if (status === 3) {
            dispatch('User/Merchant/updateStatus', status, { root: true });
            dispatch('fetchAgreementMetadata', 20);
            return;
          }

          if (status === 4) {
            dispatch('User/Merchant/updateStatus', status, { root: true });
            dispatch('User/Merchant/completeStep', 'license', { root: true });
            delay(async () => {
              await dispatch('fetchAgreementMetadata', 20);
              await dispatch('fetchDocument');
            }, 1000);
          }
        });
        centrifuge.connect();
      },
      stopWatchForChangeStatus() {
        if (centrifuge) {
          centrifuge.disconnect();
          centrifuge = null;
        }
      },
    },
  };
}
