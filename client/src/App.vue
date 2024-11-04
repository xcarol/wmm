<template>
  <v-app>
    <progress-dialog />
    <message-dialog />
    <app-drawer
      :show="showAppDrawer"
      @on-option-selected="optionSelected"
    />
    <v-app-bar :elevation="2">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="showAppDrawer = !showAppDrawer"></v-app-bar-nav-icon>
      </template>
      <v-app-bar-title>{{ title }}</v-app-bar-title>
    </v-app-bar>
    <v-main v-resize="onResize">
      <router-view />
    </v-main>
    <snack-bar />
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import {
  VApp,
  VAppBar,
  VMain,
  VAppBarTitle,
  VAppBarNavIcon,
} from 'vuetify/lib/components/index.mjs';
import AppDrawer from './components/AppDrawer.vue';
import SnackBar from './components/SnackBar.vue';
import ProgressDialog from './components/ProgressDialog.vue';
import MessageDialog from './components/MessageDialog.vue';
import { useAppStore } from './stores/app';

const appStore = useAppStore();

const showAppDrawer = ref(false);
const title = ref("Where's My Money");

const onResize = () => {
  appStore.viewHeight = window.innerHeight;
};

const optionSelected = (optionTitle) => {
  showAppDrawer.value = false;
  title.value = optionTitle;
};
</script>
