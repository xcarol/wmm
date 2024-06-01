import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueCookies from 'vue-cookies';

import App from './App.vue';
import router from './router';
import i18n from './plugins/i18n';
import vuetify from './plugins/vuetify';

const app = createApp(App);

app.use(createPinia());
app.use(VueCookies);
app.use(router);
app.use(i18n);
app.use(vuetify);

app.mount('#app');
