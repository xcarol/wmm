<template>
  <v-app>
    <v-app-bar :elevation="24">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="showDrawer = !showDrawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>Where's My Money</v-app-bar-title>
    </v-app-bar>
    <v-navigation-drawer
      v-model="showDrawer"
      :fixed="$vuetify.display.mdAndDown"
      :bottom="$vuetify.display.xs"
    >
      <v-list :items="items"></v-list>
    </v-navigation-drawer>
    <v-main class="app-backgroud">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const showDrawer = ref(true);

const items = [
  {
    title: $t('mainDrawer.Import'),
    value: 1,
  },
  {
    title: $t('mainDrawer.Categorize'),
    value: 2,
  },
];
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
