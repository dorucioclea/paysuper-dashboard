export default {
  merchant_owner: {
    editCompany: true, // Редактирование данных компании
    viewCompany: true, // Просмотр данных компании
    signing: true, // Подписание договора с компанией
    inviteProjectUsers: true, // Приглашение новых пользователей в проект и изменение их прав
    viewProjectUsers: true, // Просмотр пользователей проекта
    createProjects: true, // Создание проектов
    editProjects: true, // Редактирование проектов
    viewProjects: true, // Просмотр проектов
    createPaylinks: true, // Создание платежных ссылок
    viewPaylinks: true, // Просмотр платежных ссылок
    viewUsers: true, // Просмотр данных пользователей
    viewTransactions: true, // Просмотр списка транзакций
    cancelTransactions: true, // Отмена транзакции
    viewRoyaltyReports: true, // Просмотр роялти отчетов
    acceptRoyaltyReports: true, // Согласование роялти отчетов
    viewPayouts: true, // Просмотр отчетов о выплате
    createPayouts: true, // Инициация выплаты
    exportPayouts: true, // Экспорт отчетов
    viewDashboard: true, // Просмотр данных дашборда
    viewDisputs: true, // Просмотр диспутов
    resolveDisputs: true, // Резолюция диспутов
  },
  merchant_developer: {
    editCompany: false,
    viewCompany: true,
    signing: false,
    inviteProjectUsers: false,
    viewProjectUsers: true,
    createProjects: true,
    editProjects: true,
    viewProjects: true,
    createPaylinks: true,
    viewPaylinks: true,
    viewUsers: true,
    viewTransactions: true,
    cancelTransactions: true,
    viewRoyaltyReports: true,
    acceptRoyaltyReports: false,
    viewPayouts: false,
    createPayouts: false,
    exportPayouts: true,
    viewDashboard: true,
    viewDisputs: true,
    resolveDisputs: false,
  },
  merchant_accounting: {
    editCompany: false,
    viewCompany: true,
    signing: false,
    inviteProjectUsers: false,
    viewProjectUsers: true,
    createProjects: false,
    editProjects: false,
    viewProjects: true,
    createPaylinks: false,
    viewPaylinks: true,
    viewUsers: false,
    viewTransactions: true,
    cancelTransactions: false,
    viewRoyaltyReports: true,
    acceptRoyaltyReports: true,
    viewPayouts: true,
    createPayouts: true,
    exportPayouts: true,
    viewDashboard: true,
    viewDisputs: false,
    resolveDisputs: false,
  },
  merchant_support: {
    editCompany: false,
    viewCompany: false,
    signing: false,
    inviteProjectUsers: false,
    viewProjectUsers: true,
    createProjects: false,
    editProjects: false,
    viewProjects: true,
    createPaylinks: false,
    viewPaylinks: false,
    viewUsers: true,
    viewTransactions: true,
    cancelTransactions: true,
    viewRoyaltyReports: false,
    acceptRoyaltyReports: false,
    viewPayouts: false,
    createPayouts: false,
    exportPayouts: true,
    viewDashboard: false,
    viewDisputs: true,
    resolveDisputs: true,
  },
  merchant_view_only: {
    editCompany: false,
    viewCompany: false,
    signing: false,
    inviteProjectUsers: false,
    viewProjectUsers: false,
    createProjects: false,
    editProjects: false,
    viewProjects: true,
    createPaylinks: false,
    viewPaylinks: true,
    viewUsers: false,
    viewTransactions: true,
    cancelTransactions: false,
    viewRoyaltyReports: false,
    acceptRoyaltyReports: false,
    viewPayouts: false,
    createPayouts: false,
    exportPayouts: false,
    viewDashboard: false,
    viewDisputs: false,
    resolveDisputs: false,
  },
};
