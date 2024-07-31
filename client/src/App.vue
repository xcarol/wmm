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
    <v-main class="app-backgroud">
      <router-view />
    </v-main>
    <snack-bar />
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import AppDrawer from './components/AppDrawer.vue';
import SnackBar from './components/SnackBar.vue';
import ProgressDialog from './components/ProgressDialog.vue';
import MessageDialog from './components/MessageDialog.vue';

const showDrawer = ref(false);
const title = ref("Where's My Money");

const optionSelected = (optionTitle) => {
  showDrawer.value = false;
  title.value = optionTitle;
};
</script>

<style>
.app-backgroud {
  background-image: url('logo-semi.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100vh;
}

.v-btn--disabled {
  opacity: 0.5 !important;
}
</style>
