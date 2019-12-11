import {
  get,
  cloneDeep,
  includes,
  isEqual,
  size,
  some,
} from 'lodash-es';
import axios from 'axios';
import mergeApiValuesWithDefaults from '@/helpers/mergeApiValuesWithDefaults';

// const merchantStatues = {
//   draft: 0,
//   agreementRequested: 1,
//   onReview: 2,
//   agreementSigning: 3,
//   agreementSigned: 4,
// };
const merchantAgreementTypes = {
  undefined: 0,
  paper: 1,
  electro: 2,
};

function mapDataApiToForm(data) {
  const defaultData = {
    id: '',
    status: 0,
    created_at: 0,
    updated_at: 0,
    first_payment_at: 0,
    last_payout: {},
    is_signed: false,
    agreement_type: 0,
    agreement_sent_via_mail: false,
    mail_tracking_link: '',
    signature_request: {},
    tariff: {},
    company: {
      address: '',
      address_additional: '',
      alternative_name: '',
      city: '',
      country: '',
      name: '',
      state: '',
      website: '',
      zip: '',
    },
    contacts: {
      authorized: {
        name: '',
        email: '',
        phone: '',
        position: '',
      },
      technical: {
        name: '',
        email: '',
        phone: '',
      },
    },
    banking: {
      account_number: '',
      address: '',
      correspondent_account: '',
      currency: '',
      name: '',
      swift: '',
      details: '',
    },
  };

  const newData = mergeApiValuesWithDefaults(defaultData, data);

  if (newData.country) {
    newData.country = newData.country.code_a2;
  }

  if (newData.banking.currency && newData.banking.currency.code_a3) {
    newData.banking.currency = newData.banking.currency.code_a3;
  }

  return newData;
}

function getDefaultAgreementDocument() {
  return {
    metadata: {
      name: 'Default agreement',
      extension: 'pdf',
      size: '0',
    },
    url: '#',
  };
}

export default function createMerchantStore() {
  return {
    state: () => ({
      merchant: null,
      merchantOriginalCopy: null,
      onboardingCompleteStepsCount: 0,
      merchantStatus: 'draft',
      hasProjects: false,
      isCompleteShown: false,
      onboardingSteps: {
        company: false,
        contacts: false,
        banking: false,
        tariff: false,
      },
      paymentMethods: [],
      paymentMethodsSort: [],
      agreementDocument: getDefaultAgreementDocument(),
    }),

    getters: {
      hasProjects(state) {
        return state.merchant.has_projects || state.hasProjects;
      },
      isMerchantChanged(state) {
        return !isEqual(state.merchant, state.merchantOriginalCopy);
      },
      isOnboardingStepsComplete(state) {
        return size(state.onboardingSteps) === 4
          && !some(state.onboardingSteps, step => step === false);
      },
      isOnboardingComplete(state, getters) {
        return getters.isOnboardingStepsComplete
          && state.merchant.status === 4
          && getters.hasProjects;
      },
    },

    mutations: {
      merchant(state, data) {
        state.merchant = data;
        state.merchantOriginalCopy = cloneDeep(data);
      },
      paymentMethods(state, data) {
        state.paymentMethods = data;
      },
      paymentMethodsSort(state, data) {
        state.paymentMethodsSort = data;
      },
      agreementDocument(state, data) {
        state.agreementDocument = data;
      },
      onboardingCompleteStepsCount(state, data) {
        state.onboardingCompleteStepsCount = data;
      },
      merchantStatus(state, data) {
        state.merchantStatus = data;
      },
      onboardingSteps(state, data) {
        state.onboardingSteps = data;
      },
      hasProjects(state, data) {
        state.hasProjects = data;
      },
      isCompleteShown(state, data) {
        state.isCompleteShown = data;
      },
    },

    actions: {
      async initState({ commit, dispatch }, merchant) {
        commit('merchant', mapDataApiToForm(merchant));
        await dispatch('fetchMerchantStatus');
      },

      async fetchMerchantStatus({
        state, commit, rootState, rootGetters,
      }) {
        let result = {};
        if (state.merchant.id && rootGetters['User/userPermissions'].viewDashboard) {
          const response = await axios.get(
            `${rootState.config.apiUrl}/admin/api/v1/merchants/status`,
          ).catch((error) => {
            console.error(error);
            // A fallback if something REALLY gone wrong. Not useful in normal flow
            return { data: {} };
          });
          result = response.data;
        }

        if (result) {
          const merchantStatus = get(result, 'status', 'draft');
          const stepsCount = get(result, 'complete_steps_count', 0);

          commit('onboardingCompleteStepsCount', stepsCount + (merchantStatus === 'life' ? 1 : 0));
          commit('merchantStatus', merchantStatus);
          commit(
            'onboardingSteps',
            get(result, 'steps', {
              company: false,
              contacts: false,
              banking: false,
              tariff: false,
            }),
          );
        }

        return result;
      },

      closeCompleteShown({ commit }) {
        commit('isCompleteShown', false);
      },

      updateStatus({ commit, state }, status) {
        commit('merchant', { ...state.merchant, status });
        commit('merchantStatus', status > 3 ? 'life' : 'draft');
      },

      completeStep({ commit, state }, stepName) {
        if (state.onboardingSteps[stepName]) {
          return;
        }
        if (!includes(['license', 'projects'], stepName)) {
          commit('onboardingSteps', {
            ...state.onboardingSteps,
            [stepName]: true,
          });
        }
        if (stepName === 'projects') {
          commit('isCompleteShown', true);
          commit('hasProjects', true);
        }
        commit('onboardingCompleteStepsCount', state.onboardingCompleteStepsCount + 1);
      },

      changeMerchant({ commit }, merchant) {
        commit('merchant', mapDataApiToForm(merchant));
      },

      async changeMerchantAgreement(
        {
          commit, dispatch,
        },
        {
          action, value, message, isPreSigned,
        },
      ) {
        if (action === 'setAgreementType') {
          await dispatch('patchMerchant', { agreement_type: merchantAgreementTypes[value] });
        }

        if (action === 'setStatus') {
          await dispatch('changeMerchantStatus', { status: value, message });
        }

        if (action === 'generateAgreement') {
          await dispatch('changeMerchantStatus', { status: 3 });
          if (isPreSigned) {
            await dispatch('patchMerchant', { has_psp_signature: true });
          }
          await dispatch('fetchAgreement');
        }

        if (action === 'revokeSigning') {
          await dispatch('changeMerchantStatus', { status: 0 });
          commit('agreementDocument', getDefaultAgreementDocument());
        }

        if (action === 'setPspSignature') {
          await dispatch('patchMerchant', { has_psp_signature: value });
        }

        if (action === 'setMerchantSignature') {
          await dispatch('patchMerchant', { has_merchant_signature: value });
        }

        if (action === 'setSentViaEmail') {
          await dispatch('patchMerchant', { agreement_sent_via_mail: value });
        }

        if (action === 'setMailTrackingLink') {
          await dispatch('patchMerchant', { mail_tracking_link: value });
        }
      },

      async changeMerchantStatus({ commit, rootState }, { status, message = '' }) {
        const response = await axios.put(
          `${rootState.config.apiUrl}/system/api/v1/merchants/change-status`,
          { status, message },
        ).catch(console.warn);

        if (response && response.status === 200) {
          commit('merchant', mapDataApiToForm(response.data));
          return true;
        }

        return false;
      },

      async fetchAgreement({ state, commit, rootState }) {
        if (state.merchant.status < 3) {
          commit('agreementDocument', getDefaultAgreementDocument());
          return;
        }

        try {
          const response = await axios.get(
            `${rootState.config.apiUrl}/admin/api/v1/merchants/agreement`,
          );

          commit('agreementDocument', response.data);
        } catch (error) {
          console.warn(error);
        }
      },

      async sendNotification({ rootState }, notification) {
        const response = await axios.post(
          `${rootState.config.apiUrl}/system/api/v1/merchants/notifications`,
          notification,
        );

        if (response && response.status === 201) {
          return true;
        }

        return false;
      },
    },

    namespaced: true,
  };
}
