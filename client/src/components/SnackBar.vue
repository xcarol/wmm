<template>
  <v-snackbar
    v-model="showSnackBar"
    multi-line
  >
    {{ snackBarText }}

    <template #actions>
      <v-btn
        @click="hideSnackBar"
      >
        {{ $t('global.close') }}
      </v-btn>
    </template>
  </v-snackbar>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';

const { t: $t } = useI18n();
const appStore = useAppStore();

const snackBarText = computed(() => appStore.alertMessage);
const showSnackBar = computed(() => appStore.alertMessage.length > 0);

const hideSnackBar = () => {
  appStore.alertMessage = '';
};
</script>
