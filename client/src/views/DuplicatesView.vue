<template>
  <v-card>
    <v-card-text>
      <v-btn>{{ $t('duplicatesView.searchButton') }}</v-btn>
      <v-spacer />
    </v-card-text>
    <v-card-text>
      <v-data-table
        v-model="selectedItems"
        :items="tableItems"
        show-select
        class="elevation-1"
        item-key="name"
      ></v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageStore } from '../stores/messageDialog';
import { useProgressStore } from '../stores/progressDialog';

const appStore = useAppStore();
const api = useApi();
const { t: $t } = useI18n();
const messageStore = useMessageStore();
const progressStore = useProgressStore();

const tableItems = ref([]);
const selectedItems = ref([]);

const searchTransactions = async () => {
  try {
    const transactions = await api.searchDuplicateTransactions();
    tableItems.value = transactions.data;
    selectedItems.value = [];
    filterMessage.value = $t('categorizeView.transactionsFound')
      .replace('%d', tableItems.value.length)
      .replace('%d', search ?? '');
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};
</script>
