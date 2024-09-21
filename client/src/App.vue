<template>
  <v-app>
    <progress-dialog />
    <message-dialog />
    <v-app-bar :elevation="24">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="showDrawer = !showDrawer"></v-app-bar-nav-icon>
      </template>
      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>
    <app-drawer
      :show="showDrawer"
      @on-option-selected="optionSelected"
    />
    <v-main>
      <router-view />
    </v-main>
    <snack-bar />
    <v-fab
      :active="showFab"
      icon="$floating"
      location="bottom end"
      absolute
      app
      @click.stop="fabClick()"
    />
  </v-app>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppDrawer from './components/AppDrawer.vue';
import SnackBar from './components/SnackBar.vue';
import ProgressDialog from './components/ProgressDialog.vue';
import MessageDialog from './components/MessageDialog.vue';
import { useAppStore } from './stores/app';

const router = useRouter();
const appStore = useAppStore();

const showDrawer = ref(false);
const showFab = computed(() => appStore.showFab);
const fabClick = computed(() => appStore.fabClick);
const title = ref("Where's My Money");

const optionSelected = (optionTitle) => {
  showDrawer.value = false;
  title.value = optionTitle;
};
router.beforeEach(() => {
  appStore.showFab = false;
});
</script>

<style>
.v-btn--disabled {
  opacity: 0.5 !important;
}
</style>
