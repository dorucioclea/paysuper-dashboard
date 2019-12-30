export default {
  currentCheckers: {
    status({ value }, { status }) {
      return status.includes(value);
    },
  },

  main: [
    {
      text: 'Status',
      view: 'status',
      filter: 'status',
      isCurrentClickable: true,
      children: [
        {
          text: 'All transactions',
          value: 'all',
        },
        {
          text: 'Created',
          value: 'created',
          color: 'blue',
        },
        {
          text: 'Pending',
          value: 'pending',
          color: 'yellow',
        },
        {
          text: 'Processed',
          value: 'processed',
          color: 'green',
        },
        {
          text: 'Refunded',
          value: 'refunded',
          color: 'red',
        },
        {
          text: 'Chargeback',
          value: 'chargeback',
          color: 'red',
        },
        {
          text: 'Rejected',
          value: 'rejected',
          color: 'transparent',
        },
        {
          text: 'Canceled',
          value: 'canceled',
          color: 'transparent',
        },
      ],
    },
  ],
  footer: [
    {
      text: 'Hide test transactions',
      view: 'checkbox',
      filter: 'hideTest',
    },
    {
      text: 'Clear filter',
      view: 'clear',
      filter: 'clear',
    },
  ],
};
