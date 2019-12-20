import { signedStatusCode } from '@/schemes/merchantStatusScheme';

function projectPagesMeta(url, label) {
  return {
    layout: 'Layout',
    isAuthRequired: true,
    specialNav: {
      backLink({ store }) {
        const projectId = store.state.Project.project.id;
        const path = url ? `/projects/${projectId}/${url}` : '/projects/';
        return {
          url: path,
          label: label || 'Back to projects',
        };
      },
    },
    mainNav: () => import('@/components/LayoutMainNavProject.vue'),
  };
}

const merchantPagesMeta = {
  layout: 'Layout',
  isAuthRequired: true,
  permission: 'viewMerchants',
  specialNav: {
    backLink({ store }) {
      const isSigned = store.state.Merchant.merchant.status === Number(signedStatusCode);
      return {
        url: isSigned ? '/merchants/' : '/agreement-requests/',
        label: 'Back to list',
      };
    },
  },
  mainNav: () => import('@/components/LayoutMainNavMerchant.vue'),
};

const routes = [
  {
    path: '/',
    component: () => import('@/pages/index.vue'),
    meta: { layout: 'PageShallow' },
    name: 'Index',
  },
  {
    path: '/reports/',
    component: () => import('@/pages/RoyaltyReportsPage.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewRoyaltyReports',
    },
    name: 'RoyaltyReportsPage',
  },
  {
    path: '/reports/:reportId',
    component: () => import('@/pages/RoyaltyReportCard.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewRoyaltyReports',
    },
    name: 'RoyaltyReportCard',
  },
  {
    path: '/transactions/',
    component: () => import('@/pages/TransactionsPage.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewTransactions',
    },
    name: 'TransactionsPage',
  },
  {
    path: '/transactions/:transactionId',
    component: () => import('@/pages/TransactionCard.vue'),
    meta: { layout: 'Layout', isAuthRequired: true, permission: 'viewTransactions' },
    name: 'TransactionsCard',
  },
  {
    path: '/projects/',
    component: () => import('@/pages/ProjectsListPage.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewProjects',
    },
    name: 'ProjectsList',
  },
  {
    path: '/projects/:id',
    component: () => import('@/pages/ProjectPage.vue'),
    redirect: { name: 'ProjectSalesOptions', permission: 'viewProjects' },
    name: 'Project',
    children: [
      {
        path: 'sales-options/',
        component: () => import('@/pages/ProjectSalesOptionsPage.vue'),
        meta: {
          ...projectPagesMeta(),
          topControls: () => import('@/components/LayoutTopControlsProjectSalesOptions.vue'),
        },
        name: 'ProjectSalesOptions',
      },
      {
        path: 'virtual-currency/',
        component: () => import('@/pages/ProjectVirtualCurrencyPage.vue'),
        meta: {
          ...projectPagesMeta(),
          topControls: () => import('@/components/LayoutTopControlsProjectSalesOptions.vue'),
        },
        name: 'ProjectVirtualCurrency',
      },
      {
        path: 'virtual-items/',
        component: () => import('@/pages/ProjectVirtualItemsPage.vue'),
        meta: {
          ...projectPagesMeta(),
          topControls: () => import('@/components/LayoutTopControlsProjectSalesOptions.vue'),
        },
        name: 'ProjectVirtualItems',
      },
      {
        path: 'virtual-items/:itemId/',
        component: () => import('@/pages/ProjectVirtualItemEditPage.vue'),
        meta: {
          ...projectPagesMeta('virtual-items/', 'Back to list'),
        },
        name: 'ProjectVirtualItemEdit',
      },
      {
        path: 'game-keys/',
        component: () => import('@/pages/ProjectKeyProductsListPage.vue'),
        meta: {
          ...projectPagesMeta(),
          topControls: () => import('@/components/LayoutTopControlsProjectSalesOptions.vue'),
        },
        name: 'ProjectKeyProductsList',
      },
      {
        path: 'game-keys/:keyProductId',
        component: () => import('@/pages/ProjectKeyProductPage.vue'),
        meta: {
          ...projectPagesMeta('game-keys/', 'Back to list'),
        },
        name: 'ProjectKeyProduct',
      },
      {
        path: 'settings/',
        component: () => import('@/pages/ProjectSettingsPage.vue'),
        meta: projectPagesMeta(),
        name: 'ProjectSettings',
      },
      {
        path: 'webhooks/',
        component: () => import('@/pages/ProjectWebhooksPage.vue'),
        meta: {
          ...projectPagesMeta(),
          // topControls: () => import('@/components/LayoutTopControlsProjectWebhooks.vue'),
        },
        name: 'ProjectWebhooks',
      },
      {
        path: 'payment-form/',
        component: () => import('@/pages/ProjectPaymentFormPage.vue'),
        meta: projectPagesMeta(),
        name: 'ProjectPaymentForm',
      },
    ],
  },
  {
    path: '/payment-links/',
    component: () => import('@/pages/PaymentLinksPage.vue'),
    meta: { layout: 'Layout', isAuthRequired: true, mainContentSize: 'large' },
    name: 'PaymentLinksPage',
  },
  {
    path: '/payment-links/:linkId/',
    component: () => import('@/pages/PaymentLinksCard.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true,
    },
    name: 'PaymentLinksCard',
  },
  {
    path: '/taxes/',
    component: () => import('@/pages/TaxesListPage.vue'),
    meta: { layout: 'Layout', isAuthRequired: true },
    name: 'TaxesList',
  },
  {
    path: '/taxes/:id',
    component: () => import('@/pages/TaxesCardPage.vue'),
    children: [
      {
        path: '',
        component: () => import('@/pages/TaxesCardCountryPage.vue'),
        meta: { layout: 'Layout', isAuthRequired: true, mainContentSize: 'large' },
        name: 'TaxesCardCountryPage',
      },
      {
        path: 'period/:periodId',
        component: () => import('@/pages/TaxesCardPeriodPage.vue'),
        meta: { layout: 'Layout', isAuthRequired: true, mainContentSize: 'large' },
        name: 'TaxesCardPeriodPage',
      },
    ],
  },
  {
    path: '/merchants/',
    component: () => import('@/pages/MerchantsListPage.vue'),
    meta: { layout: 'Layout', isAuthRequired: true, permission: 'viewMerchants' },
    name: 'MerchantsList',
  },
  {
    path: '/merchants/:id',
    component: () => import('@/pages/MerchantAdminPage.vue'),
    redirect: { name: 'MerchantAdminCompanyInfo' },
    children: [
      {
        path: 'personal-profile/',
        component: () => import('@/pages/MerchantAdminPersonalProfilePage.vue'),
        meta: merchantPagesMeta,
        name: 'MerchantAdminPersonalProfile',
      },
      {
        path: 'company-info/',
        component: () => import('@/pages/MerchantAdminCompanyInfoPage.vue'),
        meta: merchantPagesMeta,
        name: 'MerchantAdminCompanyInfo',
      },
      {
        path: 'license-agreement/',
        component: () => import('@/pages/MerchantAdminLicenseAgreementPage.vue'),
        meta: merchantPagesMeta,
        name: 'MerchantAdminLicenseAgreement',
      },
      {
        path: 'payment-methods/',
        component: () => import('@/pages/MerchantAdminPaymentMethodsPage.vue'),
        meta: merchantPagesMeta,
        name: 'MerchantAdminPaymentMethods',
      },
      {
        path: 'history/',
        component: () => import('@/pages/MerchantAdminHistoryPage.vue'),
        meta: merchantPagesMeta,
        name: 'MerchantAdminHistory',
      },
    ],
  },
  {
    path: '/settings/',
    component: () => import('@/pages/MerchantSettingsPage.vue'),
    redirect: { name: 'MerchantUserRoles' },
    name: 'MerchantSettings',
    children: [
      {
        path: 'user-roles/',
        component: () => import('@/pages/MerchantUserRoles.vue'),
        meta: {
          layout: 'Layout',
          isAuthRequired: true,
          permission: 'inviteProjectUsers',
          topControls: () => import('@/components/LayoutTopControlsSettings.vue'),
        },
        name: 'MerchantUserRoles',
      },
      {
        path: 'user-roles/:id',
        component: () => import('@/pages/MerchantUserPage.vue'),
        meta: {
          layout: 'Layout',
          isAuthRequired: true,
          permission: 'inviteProjectUsers',
          topControls: () => import('@/components/LayoutTopControlsSettings.vue'),
        },
        name: 'MerchantUserPage',
      },
    ],
  },
  {
    path: '/agreement-requests/',
    component: () => import('@/pages/AgreementRequestsListPage.vue'),
    meta: { layout: 'Layout', isAuthRequired: true, permission: 'viewMerchants' },
    name: 'AgreementRequestsList',
  },
  {
    path: '/dashboard/',
    component: () => import('@/pages/Dashboard.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewDashboard',
    },
    name: 'Dashboard',
  },
  {
    path: '/company/',
    component: () => import('@/pages/Company.vue'),
    meta: { layout: 'Layout', isAuthRequired: true, permission: 'viewCompany' },
    name: 'company',
  },
  {
    path: '/payouts/',
    component: () => import('@/pages/payouts.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewPayouts',
    },
    name: 'payouts',
  },
  {
    path: '/payouts/:id',
    component: () => import('@/pages/payoutCard.vue'),
    meta: {
      layout: 'Layout', isAuthRequired: true, mainContentSize: 'large', permission: 'viewPayouts',
    },
    name: 'payoutCard',
  },
  {
    path: '/docs/',
    component: () => import('@/pages/docs.vue'),
  },
  {
    path: '/eula/',
    component: () => import('@/pages/eula.vue'),
  },
  {
    path: '/oauth/',
    component: () => import('@/pages/oauth.vue'),
  },
  {
    path: '/payment_finished/',
    component: () => import('@/pages/payment_finished.vue'),
  },
  {
    path: '/privacy_policy/',
    component: () => import('@/pages/privacy_policy.vue'),
  },

  {
    path: '/login/',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { layout: 'PageShallow' },
    name: 'Login',
  },
  {
    path: '/logout/',
    component: () => import('@/pages/LogoutPage.vue'),
    name: 'Logout',
  },
  {
    path: '/profile/',
    component: () => import('@/pages/UserProfilePage.vue'),
    meta: { layout: 'PageShallow', isAuthRequired: true, primaryOnboardingStep: 'profile' },
    name: 'UserProfile',
  },
  {
    path: '/invite-profile/',
    component: () => import('@/pages/UserInviteProfilePage.vue'),
    meta: { layout: 'PageShallow', isAuthRequired: true, primaryOnboardingStep: 'inviteProfile' },
    name: 'UserInviteProfile',
  },
  {
    path: '/user-handling-error/',
    component: () => import('@/pages/UserHandlingErrorPage.vue'),
    meta: { layout: 'PageShallow', isAuthRequired: true },
    name: 'UserHandlingError',
  },
  {
    path: '/sign-up/',
    component: () => import('@/pages/SignUp.vue'),
    meta: { layout: 'PageShallow' },
  },
  {
    path: '/confirm_email/',
    component: () => import('@/pages/ConfirmEmailPage.vue'),
    meta: { initStore: ['config'] },
  },
  {
    path: '/icons/',
    component: () => import('@/pages/IconsPage.vue'),
    meta: { initStore: false },
  },
  {
    path: '/ui/',
    component: () => import('@/pages/ComponentsPage.vue'),
    meta: { initStore: false },
  },

  {
    path: '*',
    name: 'notFound',
    component: () => import('@/pages/Error404Page.vue'),
  },
];

export default routes;
