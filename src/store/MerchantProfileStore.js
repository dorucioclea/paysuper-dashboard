import axios from 'axios';
import { get } from 'lodash-es';
import mergeApiValuesWithDefaults from '@/helpers/mergeApiValuesWithDefaults';

function mapDataApiToForm(data = {}) {
  const defaultData = {
    personal: {
      first_name: '',
      last_name: '',
      position: '',
    },
    help: {
      product_promotion_and_development: false,
      released_game_promotion: false,
      international_sales: false,
      other: false,
    },
    company: {
      company_name: '',
      website: '',
      annual_income: null,
      number_of_employees: null,
      kind_of_activity: '',
      monetization: {
        paid_subscription: false,
        in_game_advertising: false,
        in_game_purchases: false,
        premium_access: false,
        other: false,
      },
      platforms: {
        pc_mac: false,
        game_console: false,
        mobile_device: false,
        web_browser: false,
        other: false,
      },
    },
    last_step: '',
    created_at: null,
    updated_at: null,
    status: 0,
  };

  const newData = mergeApiValuesWithDefaults(defaultData, data);

  if (newData.country) {
    newData.country = newData.country.code_a2;
  }

  return newData;
}

export default function createUserStore() {
  return {
    namespaced: true,
    state: {
      profile: mapDataApiToForm(),
    },
    getters: {},
    mutations: {
      profile(state, value) {
        state.profile = value;
      },
    },
    actions: {
      initState({ dispatch }, { profileId }) {
        return dispatch('fetchProfile', profileId);
      },
      async fetchProfile({ commit }, profileId) {
        const defaultProfile = mapDataApiToForm();
        if (!profileId) {
          commit('profile', defaultProfile);
          return;
        }
        try {
          const response = await axios.get(`{apiUrl}/system/api/v1/user/profile/${profileId}`);
          commit('profile', mapDataApiToForm(get(response, 'data', {})));
        } catch (error) {
          commit('profile', defaultProfile);
        }
      },
    },
  };
}
