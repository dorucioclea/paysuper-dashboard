import axios from 'axios';
import { saveAs } from 'file-saver';
import { includes, get } from 'lodash-es';

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

export default function createMerchantLicenseAgreementStore() {
  return {
    namespaced: true,
    state: {
      merchantId: null,
      isAgreementLoading: false,
      agreement: getDefaultAgreementDocument(),
      document: null,
      operatingCompanies: [],
      operatingCompany: null,
    },
    getters: {
      status(state, getters, rootState) {
        return get(rootState, 'Merchant.merchant.status', 0);
      },
    },
    actions: {
      async initState({ commit, dispatch, getters }, merchantId) {
        commit('merchantId', merchantId);

        await dispatch('Merchant/fetchMerchantById', merchantId, { root: true });
        await dispatch('fetchOperatingCompanies');
        await dispatch('fetchAgreementMetadata');

        const { status } = getters;

        if (includes([3, 4, 7, 8], status)) {
          await dispatch('fetchDocument');
        }
      },
      async fetchOperatingCompanies({ commit }) {
        const response = await axios.get('{apiUrl}/system/api/v1/operating_company');

        if (response.data) {
          const companies = response.data.map(item => ({
            label: `${item.name} (${item.country})`,
            value: item.id,
          }));
          commit('operatingCompanies', companies);
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
        const { agreement, merchantId } = state;
        const response = await axios.get(
          `{apiUrl}/system/api/v1/merchants/${merchantId}/agreement`,
        );
        const newSize = get(response, 'data.metadata.size', null);
        if (newSize && newSize !== agreement.metadata.size) {
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
        const { merchantId } = state;
        const { url } = state.agreement;
        const { size, extension } = state.agreement.metadata;

        if (!merchantId || url === '#' || size === 0) {
          return false;
        }

        const response = await axios.get(
          `{apiUrl}/system/api/v1/merchants/${merchantId}/agreement/document`,
          {
            headers: { Accept: `application/${extension}` },
            responseType: 'blob',
          },
        );

        if (response.status === 200) {
          commit('document', response.data);
          commit('isAgreementLoading', false);
          return true;
        }

        return false;
      },
      async setOperatingCompany({ commit, state, dispatch }, id) {
        const { merchantId } = state;

        if (merchantId) {
          const response = await axios.post(
            `{apiUrl}/system/api/v1/merchants/${merchantId}/set_operating_company`,
            { operating_company_id: id },
          );
          if (response) {
            commit('operatingCompany', response.id);
            dispatch('Merchant/fetchMerchantById', state.merchantId, { root: true });
          }
        }
      },
    },
    mutations: {
      merchantId(store, value) {
        store.merchantId = value;
      },
      agreement(state, data) {
        state.agreement = data;
      },
      document(state, data) {
        state.document = data;
      },
      hasSigned(state, data) {
        state.hasSigned = data;
      },
      isAgreementLoading(state, data) {
        state.isAgreementLoading = data;
      },
      status(state, data) {
        state.status = data;
      },
      operatingCompanies(state, data) {
        state.operatingCompanies = data;
      },
      operatingCompany(state, data) {
        state.operatingCompany = data;
      },
    },
  };
}
