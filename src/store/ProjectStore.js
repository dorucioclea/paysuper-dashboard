import axios from 'axios';
import { get, find } from 'lodash-es';
import assert from 'simple-assert';
import mergeApiValuesWithDefaults from '@/helpers/mergeApiValuesWithDefaults';
import updateLangFields from '@/helpers/updateLangFields';
import { getCurrencyValueFromItem } from '@/helpers/currencyDataConversion';
import { DEFAULT_CURRENCY_IS_NOT_SET } from '@/errors';

function mapDataFormToApi(data) {
  return data;
}

function mapDataApiToForm(data, { langFields, defaultCurrency }) {
  const mergedData = mergeApiValuesWithDefaults({
    cover: {
      images: {
        en: '',
      },
      use_one_for_all: true,
    },
    name: {
      en: '',
    },
    full_description: {
      en: '',
    },
    short_description: {
      en: '',
    },
    localizations: ['en'],
    currencies: [
      defaultCurrency,
    ],
    callback_protocol: 'empty',
    vat_payer: 'buyer',
  }, data);

  if (!find(mergedData.currencies, defaultCurrency)) {
    mergedData.currencies.unshift(defaultCurrency);
  }

  // Its important to set langs here, not in the component because otherwise
  // a user will get "save your changes" modal without any actual changes
  updateLangFields(mergedData, langFields, mergedData.localizations);
  return mergedData;
}

export default function createProjectStore() {
  return {
    state: {
      defaultCurrency: null,
      project: null,
      projectPublicName: '',
      langFields: ['cover.images', 'name', 'full_description', 'short_description'],
    },

    getters: {
      currenciesTags(state) {
        return state.project.currencies.map((item) => {
          if (item.currency === item.region) {
            return item.currency;
          }
          return `${item.currency}-${item.region}`;
        });
      },
      defaultCurrencyValue(state) {
        return getCurrencyValueFromItem(state.defaultCurrency);
      },
    },

    mutations: {
      defaultCurrency(state, value) {
        state.defaultCurrency = value;
      },
      project(state, value) {
        state.project = mapDataApiToForm(value, state);
      },
      projectPublicName(state, value) {
        state.projectPublicName = value;
      },
      currencies(state, value) {
        localStorage.setItem('projectCurrencies', JSON.stringify(value));
        state.currencies = value;
      },
    },

    actions: {
      async initState({ commit, dispatch, rootState }, { id }) {
        commit('project', {});
        const defaultCurrency = get(rootState.User.Merchant.merchant, 'banking.currency');
        if (!defaultCurrency) {
          throw DEFAULT_CURRENCY_IS_NOT_SET;
        }
        const defaultCurrencyObject = { currency: defaultCurrency, region: defaultCurrency };
        commit('defaultCurrency', defaultCurrencyObject);
        await dispatch('fetchProject', id);
      },

      async fetchProject({ state, commit, rootState }, id) {
        const { data } = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/projects/${id}`);
        commit('project', data.item);
        commit('projectPublicName', state.project.name.en);
      },

      async saveProject({ state, commit, rootState }, project) {
        const { data } = await axios.patch(
          `${rootState.config.apiUrl}/admin/api/v1/projects/${state.project.id}`,
          mapDataFormToApi(project),
        );
        commit('project', data);
        commit('projectPublicName', state.project.name.en);
      },

      async checkIsSkuUnique({ state, rootState }, sku) {
        try {
          await axios.post(
            `${rootState.config.apiUrl}/admin/api/v1/projects/${state.project.id}/sku`,
            {
              sku,
            },
          );
        } catch (error) {
          // (sku+project id already exist)
          if (get(error, 'response.data.code') === 'kp000006') {
            return false;
          }
          throw error;
        }
        return true;
      },

      async getRecommendedPrices(ctx, { type, amount, currency }) {
        assert(type === 'steam' || type === 'conversion');
        const path = `/api/v1/pricing/recommended/${type}?amount=${amount}&currency=${currency}`;
        const { data } = await axios.get(`{apiUrl}${path}`);
        return data.recommended_price;
      },
    },

    namespaced: true,
  };
}
