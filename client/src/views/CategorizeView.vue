<template>
  <v-card>
    <v-card-text>
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
    <v-card-actions>
      <v-combobox
        v-model="selectedCategory"
        :label="$t('categorizeView.categoryLabel')"
        :items="categories"
        clearable
        variant="outlined"
        @click:append="searchTransactions"
        @keydown="keyDown"
      />
      <v-btn :disabled="canApplyCategory">{{ $t('categorizeView.applyButton') }}</v-btn>
      <v-btn>{{ $t('categorizeView.createFilterButton') }}</v-btn>
    </v-card-actions>
  </v-card>
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
const selectedItems = ref([]);
const filterMessage = ref('');
const selectedCategory = ref('');
const categories = ref(['']);

const canApplyCategory = computed(() => {
  return !!(
    selectedItems.value.length === 0 ||
    selectedCategory.value === null ||
    selectedCategory.value.length === 0
  );
});

const searchTransactions = async () => {
  const search = selectedFilter.value;
  appStore.addSearchToCategoryHistory(search);

  try {
    const transactions = await api.searchTransactionsByCategory(search);
    tableItems.value = transactions.data;
    filterMessage.value = $t('categorizeView.transactionsFound')
      .replace('%d', tableItems.value.length)
      .replace('%d', search ?? '');
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
