const filters = {
  quickFilter: {
    defaultValue: '',
    apiQueryName: 'name',
  },

  sort: {
    defaultValue: () => [],
  },

  limit: {
    isPassingToQueryDisabled: true,
    defaultValue: 30,
  },

  offset: {
    isPassingToQueryDisabled: true,
    defaultValue: 0,
  },

  status: {
    defaultValue: () => [],
  },

  dateFrom: {
    defaultValue: null,
    apiQueryName: 'pm_date_from',
  },

  dateTo: {
    defaultValue: null,
    apiQueryName: 'pm_date_to',
  },

  hideTest: {
    defaultValue: null,
    apiQueryName: 'hide_test',
  },
};

export default {
  filters,
};
