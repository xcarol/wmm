<template>
  <v-app>
    <v-app-bar :elevation="24">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="showDrawer = !showDrawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>
    <v-navigation-drawer
      v-model="showDrawer"
      :fixed="$vuetify.display.mdAndDown"
      :bottom="$vuetify.display.xs"
    >
      <v-list :items="items">
        <v-list-item
          v-for="(item, index) in items"
          :key="index"
          @click="selectItem(item)"
        >
          {{ item.title }}
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main class="app-backgroud">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t: $t } = useI18n();
const router = useRouter();

const showDrawer = ref(true);
const title = ref("Where's My Money");

const items = [
  {
    title: $t('mainDrawer.import'),
    value: '/import',
    barTitle: $t('importView.title'),
  },
  {
    title: $t('mainDrawer.categorize'),
    value: '/categorize',
  },
];

const selectItem = (item) => {
  showDrawer.value = false;
  router.push(item.value);
};

router.beforeEach((to) => {
  if (to.path === '/') {
    title.value = "Where's My Money";
    return;
  }
  
  items.forEach((item) => {
    if (item.value === to.path) {
      title.value = item.barTitle;
    }
  });
});


</script>
<style scoped>
.app-backgroud {
  background-image: url('logo-semi.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100vh;
}
</style>
