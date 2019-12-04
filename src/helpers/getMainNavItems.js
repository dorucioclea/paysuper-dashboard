export default function getMainNavItems(permissions, {
  hasDefaultCurrency,
  stepsCount,
}) {
  const hideToAdmin = permissions.viewMerchantsList;

  return [
    {
      additional: 'Homepage for main controls',
      icon: 'IconDashboard',
      link: '/dashboard',
      title: 'Dashboard',
      routeNames: ['Dashboard'],
      isAvailable: permissions.viewDashboard,
      isHidden: hideToAdmin,
    },
    {
      additional: 'Organise your products for sales',
      unavailableReason: 'Need to fill banking info first',
      icon: 'IconFolder',
      link: '/projects',
      title: 'Projects',
      routeNames: ['ProjectsList'],
      isAvailable: permissions.viewProjects && hasDefaultCurrency,
      isHidden: hideToAdmin,
    },
    {
      additional: 'Payment links',
      unavailableReason: 'Links for quick products sale',
      icon: 'IconBlank',
      link: '/payment-links',
      title: 'Payment links',
      routeNames: ['PaymentLinksPage'],
      isAvailable: true,
    },
    {
      additional: 'Weekly royalty reports',
      icon: 'IconBlank',
      link: '/reports',
      title: 'Royalty reports',
      routeNames: ['RoyaltyReportsPage'],
      isAvailable: permissions.viewRoyaltyReports && stepsCount === 5,
      isHidden: hideToAdmin,
    },
    {
      additional: 'Cash reports',
      icon: 'IconCash',
      link: '/payouts',
      title: 'Payouts',
      routeNames: ['payouts', 'payoutCard'],
      isAvailable: permissions.viewPayouts && stepsCount === 5,
      isHidden: hideToAdmin,
    },
    {
      additional: 'Full list of customer transactions',
      icon: 'IconCoin',
      link: '/transactions',
      title: 'Transaction Search',
      routeNames: ['TransactionsPage'],
      isAvailable: permissions.viewTransactions && stepsCount === 5,
      isHidden: hideToAdmin,
    },
    {
      title: 'Merchants',
      additional: 'Description',
      icon: 'IconBlank',
      link: '/merchants',
      routeNames: ['MerchantsList'],
      isAvailable: permissions.viewMerchantsList,
      isHidden: !hideToAdmin,
    },
    {
      title: 'Agreement requests',
      additional: 'Description',
      icon: 'IconBlank',
      link: '/agreement-requests',
      routeNames: ['AgreementRequestsList'],
      isAvailable: permissions.viewMerchantsList,
      isHidden: !hideToAdmin,
    },
    {
      additional: 'Technical integrations',
      icon: 'IconRepeat',
      link: '/intagrations',
      title: 'Integrations',
      isAvailable: false,
      isHidden: true,
    },
    {
      additional: 'Need license agreement',
      icon: 'IconExcited',
      link: '/customers',
      title: 'Customers',
      isAvailable: false,
      isHidden: true,
    },
  ];
}
