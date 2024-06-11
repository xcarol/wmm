import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ImportView from '../views/ImportView.vue';
import CategorizeView from '../views/CategorizeView.vue';
import SqlView from '../views/SqlView.vue';

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
      path: '/categorize',
      name: 'categorize',
      component: CategorizeView,
    },
    {
      path: '/sql',
      name: 'sql',
      component: SqlView,
    },
  ],
});

export default router;
