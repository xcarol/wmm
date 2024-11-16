import { createRouter, createWebHistory } from 'vue-router';
import i18n from '../plugins/i18n';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('../views/ImportView.vue'),
      meta: { title: i18n.global.t('importView.title') },
    },
    {
      path: '/add-transaction',
      name: 'addTransaction',
      component: () => import('../views/AddTransactionView.vue'),
      meta: { title: i18n.global.t('addTransactionView.title') },
    },
    {
      path: '/banks',
      name: 'banks',
      component: () => import('../views/BanksView.vue'),
      meta: { title: i18n.global.t('banksView.title') },
    },
    {
      path: '/categorize',
      name: 'categorize',
      component: () => import('../views/CategorizeView.vue'),
      meta: { title: i18n.global.t('categorizeView.title') },
    },
    {
      path: '/duplicates',
      name: 'duplicates',
      component: () => import('../views/DuplicatesView.vue'),
      meta: { title: i18n.global.t('duplicatesView.title') },
    },
    {
      path: '/sql',
      name: 'sql',
      component: () => import('../views/SqlView.vue'),
      meta: { title: i18n.global.t('sqlView.title') },
    },
    {
      path: '/filters',
      name: 'filters',
      component: () => import('../views/FiltersView.vue'),
      meta: { title: i18n.global.t('filtersView.title') },
    },
    {
      path: '/browse/transactions',
      name: 'browseTransactions',
      component: () => import('../views/BrowseTransactionsView.vue'),
      meta: { title: i18n.global.t('browseTransactionsView.title') },
    },
    {
      path: '/browse/categories',
      name: 'browseCategories',
      component: () => import('../views/BrowserCategoriesView.vue'),
      meta: { title: i18n.global.t('browseCategoriesView.title') },
    },
    {
      path: '/browse/timeline',
      name: 'browseTimeline',
      component: () => import('../views/BrowseTimelineView.vue'),
      meta: { title: i18n.global.t('browseTimelineView.title') },
    },
  ],
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "Where's My Money";
  next();
});

export default router;
