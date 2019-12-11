<script>
import { debounce } from 'lodash-es';
import { mapState, mapGetters, mapActions } from 'vuex';
import Notifications from '@/mixins/Notifications';
import ProjectsListStore from '@/store/ProjectsListStore';
import ProjectPanelItem from '@/components/ProjectPanelItem.vue';
import NoResults from '@/components/NoResults.vue';
import NewProjectModal from '@/components/NewProjectModal.vue';

export default {
  name: 'ProjectsListPage',
  mixins: [Notifications],
  components: {
    ProjectPanelItem,
    NoResults,
    NewProjectModal,
  },
  async asyncData({ store, registerStoreModule, route }) {
    try {
      await registerStoreModule('ProjectsListing', ProjectsListStore, {
        query: route.query,
      });
    } catch (error) {
      store.dispatch('setPageError', error);
    }
  },
  data() {
    return {
      filters: {},
      isSearchRouting: false,
      isDeactivationModalOpened: false,
      isNewProjectModalOpened: false,
      projectIdForAction: null,

      statusFilterOptions: [
        { label: 'All projects', value: '' },
        { label: 'Only active', value: 'active' },
        { label: 'Only inactive', value: 'inactive' },
      ],
    };
  },
  computed: {
    ...mapState('ProjectsListing', ['projects', 'query']),
    ...mapGetters('ProjectsListing', ['getFilterValues']),
    ...mapGetters('User', ['userPermissions']),
    ...mapGetters('User/Merchant', ['hasProjects']),

    handleQuickSearchInput() {
      return debounce(() => {
        this.searchProjects();
      }, 500);
    },

    isFiltersNotEmpty() {
      return Boolean(this.filters.quickFilter || this.filters.status);
    },
  },

  beforeRouteUpdate(to, from, next) {
    if (!this.isSearchRouting) {
      this.initQuery(to.query);
      this.updateFiltersFromQuery();
    }
    this.isSearchRouting = false;
    next();
  },

  created() {
    this.updateFiltersFromQuery();
  },

  methods: {
    ...mapActions(['setIsLoading', 'uploadImage']),
    ...mapActions('ProjectsListing', [
      'deactivateProject', 'activateProject', 'fetchProjects', 'createProject',
      'submitFilters', 'initQuery',
    ]),
    ...mapActions('User/Merchant', ['completeStep']),

    updateFiltersFromQuery() {
      this.filters = this.getFilterValues(['quickFilter', 'status']);
    },

    async searchProjects() {
      this.setIsLoading(true);
      this.submitFilters(this.filters);
      this.navigate();
      await this.fetchProjects().catch(this.$_Notifications_showErrorMessage);
      this.setIsLoading(false);
    },

    navigate() {
      this.isSearchRouting = true;
      this.$navigate(this.$route.path, this.query);
    },

    openDeactivateDialog(projectId) {
      this.isDeactivationModalOpened = true;
      this.projectIdForAction = projectId;
    },

    async tryToDeactivateProject() {
      this.setIsLoading(true);
      try {
        await this.deactivateProject(this.projectIdForAction);
        await this.fetchProjects();
        this.$_Notifications_showSuccessMessage('Project has been disactivated');
      } catch (error) {
        this.$_Notifications_showErrorMessage(error);
      }
      this.setIsLoading(false);
      this.isDeactivationModalOpened = false;
    },

    async handleProjectActivate(projectId) {
      this.setIsLoading(true);
      try {
        await this.activateProject(projectId);
        await this.fetchProjects();
        this.$_Notifications_showSuccessMessage('Project has been activated');
      } catch (error) {
        this.$_Notifications_showErrorMessage(error);
      }
      this.setIsLoading(false);
    },

    async handleCreateNewProject({ name, image }) {
      this.isNewProjectModalOpened = false;
      this.setIsLoading(true);
      try {
        const projectId = await this.createProject({
          name: {
            en: name,
          },
          cover: {
            images: {
              en: image,
            },
            use_one_for_all: true,
          },
        });
        /**
         * TODO: after https://protocolone.tpondemand.com/restui/board.aspx?#page=task/191909
         * remove this and use has_projects attribute from merchant object
         */
        if (!this.hasProjects) {
          this.completeStep('projects');
        }
        this.$router.push({
          name: 'Project',
          params: {
            id: projectId,
          },
        });
        this.$showSuccessMessage('Project created successfully');
      } catch (error) {
        this.$showErrorMessage(error);
      }
      this.setIsLoading(false);
    },
  },
};
</script>

<template>
<div>
  <UiHeader level="2" :hasMargin="true">Projects</UiHeader>
  <p class="description">
    There is your full list of projects here. Setup every parameter, add products,
    proceed with technical S2S integration to activate every project sales.
  </p>
  <div class="controls">
    <UiButton
      v-if="userPermissions.createProjects"
      :noSidePaddings="true"
      @click="isNewProjectModalOpened = true"
    >
      <IconPlus slot="iconBefore" />
      CREATE PROJECT
    </UiButton>
    <div class="filters">
      <UiFilterSearchInput
        v-model="filters.quickFilter"
        @input="handleQuickSearchInput"
      />
      <UiSelectAsButton
        v-model="filters.status"
        color="transparent-gray"
        :isTransparent="true"
        :options="statusFilterOptions"
        @input="searchProjects"
      />
    </div>
  </div>
  <div class="content">
    <ProjectPanelItem
      class="panel-item"
      v-for="project in projects.items"
      :key="project.id"
      :project="project"
      @deactivate="openDeactivateDialog"
      @activate="handleProjectActivate"
    />
    <NoResults
      v-if="!projects.items"
      :type="isFiltersNotEmpty ? 'no-results' : 'add-new'"
    >
      <span v-if="!isFiltersNotEmpty">You don’t have any projects yet</span>
    </NoResults>
  </div>

  <UiDeleteModal
    v-if="isDeactivationModalOpened"
    title="Deactivation"
    submitButtonText="Deactivate"
    @close="isDeactivationModalOpened = false"
    @submit="tryToDeactivateProject"
  >
    You can deactivate the project, if you want to stop all activities in it.
  </UiDeleteModal>

  <NewProjectModal
    v-if="isNewProjectModalOpened"
    :uploadImage="uploadImage"
    @close="isNewProjectModalOpened = false"
    @submit="handleCreateNewProject"
  />

</div>
</template>

<style lang="scss" scoped>
.description {
  max-width: 566px;
  margin-bottom: 24px;
}

.controls {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e3e5e6;
  display: flex;
  justify-content: space-between;
}

.filters {
  display: flex;

  & > * {
    margin-left: 8px;
  }
}

.content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.panel-item {
  width: 290px;
  margin-right: 24px;
  margin-bottom: 24px;
  &:nth-child(3n + 3) {
    margin-right: 0;
  }
}
</style>
