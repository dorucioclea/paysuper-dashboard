import axios from 'axios';
import assert from 'simple-assert';
import { get, includes } from 'lodash-es';
import UserNotificationsStore from '@/store/UserNotificationsStore';
import UserMerchantStore from '@/store/UserMerchantStore';
import UserProfileStore from '@/store/UserProfileStore';
import permissions from '@/schemes/permissionsScheme';
import { UNAUTHORIZED } from '@/errors';

export default function createUserStore(resources) {
  const accessToken = localStorage.getItem('token') || '';
  const inviteToken = localStorage.getItem('inviteToken') || '';
  return {
    state: {
      accessToken,
      inviteToken,
      isAuthorised: false,
      primaryOnboardingStep: 'initial',
      role: 'newbie',
    },

    mutations: {
      accessToken(state, value) {
        state.accessToken = value;
      },
      inviteToken(state, value) {
        state.inviteToken = value;
      },
      isAuthorised(state, value) {
        state.isAuthorised = value;
      },
      primaryOnboardingStep(state, value) {
        assert(
          includes(['initial', 'profile', 'inviteProfile', 'finished'], value),
          `invalid primaryOnboardingStep value: ${value}`,
        );
        state.primaryOnboardingStep = value;
      },
      role(state, value) {
        state.role = value;
      },
    },

    getters: {
      authIframeSrc(state, getters, rootState) {
        return `${rootState.config.ownBackendUrl}/auth1/login`;
      },
      userPermissions(state) {
        return permissions[state.role];
      },
    },

    actions: {
      async initState({ state, commit, dispatch }) {
        try {
          if (!state.accessToken) {
            await dispatch('refreshToken').catch(() => { throw UNAUTHORIZED; });
          }
          const { profile, merchant, role } = await dispatch('getMetaProfile');
          commit('role', role.role);
          commit('isAuthorised', true);
          await dispatch('Profile/initState', profile);
          await dispatch('Merchant/initState', merchant);
          await dispatch('checkPrimaryOnboardingStep');

          dispatch('Notifications/initState');
        } catch (error) {
          if (error !== UNAUTHORIZED) {
            console.error(error);
            resources.notifications.showErrorMessage(
              'User initialization failed. Please reload the page',
            );
          }
        }
      },

      async setInviteToken({ state, commit, dispatch }, token) {
        localStorage.setItem('inviteToken', token);
        commit('inviteToken', token);
        if (state.isAuthorised) {
          await dispatch('checkPrimaryOnboardingStep');
        }
      },

      async checkPrimaryOnboardingStep({ state, commit }) {
        if (state.Profile.profile.email.confirmed) {
          commit('primaryOnboardingStep', 'finished');
          return;
        }
        if (!state.inviteToken) {
          commit('primaryOnboardingStep', 'profile');
          return;
        }
        try {
          await axios.post('{apiUrl}/auth/api/v1/user/invite/check', {
            token: state.inviteToken,
          });
          commit('primaryOnboardingStep', 'inviteProfile');
        } catch (error) {
          commit('primaryOnboardingStep', 'profile');
          console.error(error);
        }
      },

      async approveInvitation({ state, commit }) {
        await axios.post('{apiUrl}/auth/api/v1/user/invite/approve', {
          token: state.inviteToken,
        });
        localStorage.removeItem('inviteToken');
        commit('inviteToken', '');
      },

      async getMetaProfile() {
        const defaults = {
          profile: {},
          merchant: {},
          role: {
            role: 'newbie',
          },
        };
        try {
          const { data } = await axios.get('{apiUrl}/auth/api/v1/user/profile/common');
          return {
            ...defaults,
            ...data,
          };
        } catch (error) {
          const errorCode = get(error, 'response.status');
          if (errorCode === 404) {
            return defaults;
          }
          if (errorCode === 401) {
            throw UNAUTHORIZED;
          }
          throw error;
        }
      },

      /**
       * Set new access token to store and localeStorage
       * @param commit
       * @param token
       */
      setAccessToken({ commit }, token) {
        localStorage.setItem('token', token);
        commit('isAuthorised', true);
        commit('accessToken', token);
      },

      setPrimaryOnboardingStep({ commit }, value) {
        commit('primaryOnboardingStep', value);
      },

      /**
       * Refresh expired token
       * @param commit
       * @param state
       * @param dispatch
       * @returns {Promise.<T>|Promise<any>|Promise}
       */
      async refreshToken({ dispatch, rootState }) {
        try {
          const response = await axios.get(`${rootState.config.ownBackendUrl}/auth1/refresh`, {
            // this method requires only cookies for authrization
            withCredentials: true,
          });
          await dispatch('setAccessToken', response.data.access_token);
        } catch (error) {
          // logout is required in case when we can't get new token (refresh failed),
          // but auth form thinks we're still logged (because of cookies)
          // In that case auth form won't show itself until we clear the cookies
          await dispatch('logout');
          throw error;
        }
      },

      async logout({ commit, dispatch, rootState }) {
        try {
          await axios.get(`${rootState.config.ownBackendUrl}/auth1/logout`, {
            withCredentials: true,
          });
          // eslint-disable-next-line
        } catch { }
        localStorage.removeItem('token');
        commit('isAuthorised', false);
        commit('primaryOnboardingStep', 'initial');
        commit('accessToken', '');
        dispatch('Profile/initState', {});
        dispatch('Merchant/initState', {});
        dispatch('Notifications/initState');
      },
    },

    namespaced: true,

    modules: {
      Notifications: UserNotificationsStore(resources),
      Merchant: UserMerchantStore(resources),
      Profile: UserProfileStore(resources),
    },
  };
}
