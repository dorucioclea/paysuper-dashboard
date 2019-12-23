import axios from 'axios';
import {
  get, camelCase, reduce, snakeCase,
} from 'lodash-es';

function getDefaultAccountInfo() {
  return {
    address: '',
    address_additional: '',
    alternative_name: '',
    city: '',
    country: '',
    name: '',
    registration_number: '',
    state: '',
    tax_id: '',
    website: '',
    zip: '',
  };
}

export default function createAccountInfoStore() {
  return {
    namespaced: true,
    state: {
      accountInfo: getDefaultAccountInfo(),
    },
    getters: {
      accountInfo(state) {
        const { accountInfo } = state;

        return reduce(accountInfo, (res, item, key) => ({
          ...res,
          [camelCase(key)]: item,
        }), {});
      },
    },
    mutations: {
      accountInfo(state, data) {
        state.accountInfo = {
          ...getDefaultAccountInfo(),
          ...data,
        };
      },
    },
    actions: {
      async initState({ commit, rootState }) {
        const merchantCompany = get(rootState, 'User.Merchant.merchant.company', {});
        const profileCompany = get(rootState, 'User.Profile.profile.company', {});

        const accountInfo = {
          ...merchantCompany,
          alternative_name: merchantCompany.alternative_name || profileCompany.company_name,
          website: merchantCompany.website || profileCompany.website,
        };

        commit('accountInfo', accountInfo);
      },
      async submitAccountInfo({ dispatch, state, rootState }) {
        const response = await axios.put(
          `${rootState.config.apiUrl}/admin/api/v1/merchants/company`,
          { ...state.accountInfo },
        );

        if (response.data) {
          dispatch('User/Merchant/changeMerchant', response.data, { root: true });
          dispatch('User/Merchant/completeStep', 'company', { root: true });
          dispatch('User/Notifications/watchForNotifications', null, { root: true });
          return true;
        }

        return false;
      },
      updateAccountInfo({ commit }, accountInfo) {
        commit('accountInfo', reduce(accountInfo, (res, item, key) => ({
          ...res,
          [snakeCase(key)]: item,
        }), {}));
      },
    },
  };
}
