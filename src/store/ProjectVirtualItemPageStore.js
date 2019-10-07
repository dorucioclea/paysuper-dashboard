import axios from 'axios';
import assert from 'simple-assert';

export default function createProjectVirtualItemPageStore() {
  return {
    state: () => ({
      virtualItem: null,
      itemId: null,
    }),

    mutations: {
      projectId(store, data) {
        store.projectId = data;
      },
      itemId(state, data) {
        state.itemId = data;
      },
      setVirtualItem(state, data) {
        state.virtualItem = data;
      },
    },

    actions: {
      async initState({ dispatch, commit }, { projectId, itemId }) {
        assert(projectId, 'ProjectVirtualItemsStore requires projectId param');
        commit('projectId', projectId);
        commit('itemId', itemId);
        if (itemId !== 'new') {
          await dispatch('fetchItemData', itemId);
        }
      },

      async fetchItemData({ commit, rootState }, id) {
        const response = await axios.get(`${rootState.config.apiUrl}/admin/api/v1/products/${id}`);
        commit('setVirtualItem', response.data.item);
      },

      /**
       * Edit Virtual item
       * @param rootState
       * @param data
       * @returns {Promise<void>}
       */
      async editItem({ rootState }, data) {
        data.project_id = rootState.Project.project.id;
        await axios.put(`${rootState.config.apiUrl}/admin/api/v1/products/${data.id}`, data);
      },

      /**
       * Create new Virtual item
       * @param rootState
       * @param data
       * @returns {Promise<void>}
       */
      async createItem({ rootState }, data) {
        data.project_id = rootState.Project.project.id;
        await axios.post(`${rootState.config.apiUrl}/admin/api/v1/products`, data);
      },
    },

    namespaced: true,
  };
}
