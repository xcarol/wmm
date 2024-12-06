import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueCookies from 'vue-cookies';
import axios from './plugins/axios';
import App from './App.vue';
import router from './router';
import i18n from './plugins/i18n';
import vuetify from './plugins/vuetify';
import api from './plugins/api';

(async () => {
  // Retrieve api url variables from express (../server.cjs) in Production mode
  const { VITE_API_URL } = await fetch('/env')
    .then((response) => response.json())
    .catch(() => {
      return {};
    });

  const app = createApp(App);

  app.config.globalProperties.VITE_API_URL = VITE_API_URL;

  app.use(createPinia());
  app.use(VueCookies);
  app.use(router);
  app.use(i18n);
  app.use(vuetify);
  app.use(axios);
  app.use(api, { axios: app.config.globalProperties.axios });

  app.mount('#app');
})();
