<template>
  <v-container>
    <v-combobox
      v-model="selectedFilter"
      :label="$t('categorizeView.filterLabel')"
      :items="filters"
      append-icon="$search"
      clearable
      variant="outlined"
      @click:append="searchTransactions"
      @keydown="keyDown"
    />
    {{ filterMessage }}
  </v-container>
  <v-container>
    <v-data-table
      v-model="selected"
      :headers="TopicHeaders"
      :items="tableItems"
      :search="searchTopics"
      show-select
      class="elevation-1"
      item-key="name"
    ></v-data-table>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';

const appStore = useAppStore();
const api = useApi();
const { t: $t } = useI18n();

const filters = computed(() => appStore.categorySearchHistory);
const selectedFilter = ref('');
const tableItems = ref([]);
const filterMessage = ref('');

const searchTransactions = async () => {
  const search = selectedFilter.value;
  appStore.addSearchToCategoryHistory(search);

  try {
    const transactions = await api.searchTransactionsByCategory(search);
    tableItems.value = transactions.data;
    filterMessage.value = $t('categorizeView.transactionsFound').replace('%d', tableItems.value.length).replace('%d', search ?? '');
  } catch (e) {
    appStore.alertMessage = e.response?.data ?? e;
  }
};

const keyDown = (value) => {
  if (value.keyCode === 13) {
    searchTransactions();
  }
};
</script>
