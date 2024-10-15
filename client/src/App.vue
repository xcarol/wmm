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
      <template #append>
        <v-btn
          v-show="showViewDrawerButton"
          icon="$view-drawer"
          @click.stop="toggleViewDrawer"
        ></v-btn>
      </template>
    </v-app-bar>
    <v-main v-resize="onResize">
      <router-view />
    </v-main>
    <snack-bar />
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

const showAppDrawer = ref(false);
const showViewDrawerButton = computed(() => appStore.showViewDrawerButton);
const title = ref("Where's My Money");

const toggleViewDrawer = () => {
  appStore.showViewDrawer = !appStore.showViewDrawer;
};

const onResize = () => {
  appStore.viewHeight = window.innerHeight;
};

const optionSelected = (optionTitle) => {
  showAppDrawer.value = false;
  title.value = optionTitle;
};

router.beforeEach(() => {
  appStore.showViewDrawerButton = false;
});
</script>

<style>
.v-btn--disabled {
  opacity: 0.5 !important;
}
</style>
