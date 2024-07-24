import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueCookies from 'vue-cookies';
import VCalendar from 'v-calendar';
import 'v-calendar/style.css';
import axios from './plugins/axios';
import App from './App.vue';
import router from './router';
import i18n from './plugins/i18n';
import vuetify from './plugins/vuetify';
import api from './plugins/api';

const app = createApp(App);

app.use(createPinia());
app.use(VueCookies);
app.use(VCalendar, {});
app.use(router);
app.use(i18n);
app.use(vuetify);
app.use(axios);
app.use(api, { axios: app.config.globalProperties.axios });

app.mount('#app');
