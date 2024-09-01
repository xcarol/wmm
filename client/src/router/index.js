import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ImportView from '../views/ImportView.vue';
import AddTransactionView from '../views/AddTransactionView.vue';
import CategorizeView from '../views/CategorizeView.vue';
import DuplicatesView from '../views/DuplicatesView.vue';
import SqlView from '../views/SqlView.vue';
import FiltersView from '../views/FiltersView.vue';
import BrowseTransactionsView from '../views/BrowseTransactionsView.vue';
import BrowseCategoriesView from '../views/BrowserCategoriesView.vue';

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
    },
    {
      path: '/add-transaction',
      name: 'addTransaction',
      component: AddTransactionView,
    },
    {
      path: '/categorize',
      name: 'categorize',
      component: CategorizeView,
    },
    {
      path: '/duplicates',
      name: 'duplicates',
      component: DuplicatesView,
    },
    {
      path: '/sql',
      name: 'sql',
      component: SqlView,
    },
    {
      path: '/filters',
      name: 'filters',
      component: FiltersView,
    },
    {
      path: '/browse/transactions',
      name: 'browseTransactions',
      component: BrowseTransactionsView,
    },
    {
      path: '/browse/categories',
      name: 'browseCategories',
      component: BrowseCategoriesView,
    },
  ],
});

export default router;
