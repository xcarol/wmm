import { createRouter, createWebHistory } from 'vue-router';
import i18n from '../plugins/i18n';
import HomeView from '../views/HomeView.vue';
import ImportView from '../views/ImportView.vue';
import AddTransactionView from '../views/AddTransactionView.vue';
import CategorizeView from '../views/CategorizeView.vue';
import DuplicatesView from '../views/DuplicatesView.vue';
import SqlView from '../views/SqlView.vue';
import FiltersView from '../views/FiltersView.vue';
import BrowseTransactionsView from '../views/BrowseTransactionsView.vue';
import BrowseCategoriesView from '../views/BrowserCategoriesView.vue';
import BrowseTimelineView from '../views/BrowseTimelineView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/import',
      name: 'import',
      component: ImportView,
      meta: { title: i18n.global.t('importView.title') },
    },
    {
      path: '/add-transaction',
      name: 'addTransaction',
      component: AddTransactionView,
      meta: { title: i18n.global.t('addTransactionView.title') },
    },
    {
      path: '/categorize',
      name: 'categorize',
      component: CategorizeView,
      meta: { title: i18n.global.t('categorizeView.title') },
    },
    {
      path: '/duplicates',
      name: 'duplicates',
      component: DuplicatesView,
      meta: { title: i18n.global.t('duplicatesView.title') },
    },
    {
      path: '/sql',
      name: 'sql',
      component: SqlView,
      meta: { title: i18n.global.t('sqlView.title') },
    },
    {
      path: '/filters',
      name: 'filters',
      component: FiltersView,
      meta: { title: i18n.global.t('filtersView.title') },
    },
    {
      path: '/browse/transactions',
      name: 'browseTransactions',
      component: BrowseTransactionsView,
      meta: { title: i18n.global.t('browseTransactionsView.title') },
    },
    {
      path: '/browse/categories',
      name: 'browseCategories',
      component: BrowseCategoriesView,
      meta: { title: i18n.global.t('browseCategoriesView.title') },
    },
    {
      path: '/browse/timeline',
      name: 'browseTimeline',
      component: BrowseTimelineView,
      meta: { title: i18n.global.t('browseTimelineView.title') },
    },
  ],
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "Where's My Money";
  next();
});

export default router;
