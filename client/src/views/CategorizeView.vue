<template>
  <new-filter-dialog
    :show="showNewFilterDialog"
    :category="selectedCategory"
    :filter="selectedItemToFilter"
    @on-ok="createNewFilter"
    @on-cancel="hideNewFilterDialog"
  />
  <message-dialog />
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
        :items="categoryNames"
        clearable
        variant="outlined"
        @click:append="searchTransactions"
        @keydown="keyDown"
      />
      <v-btn
        :disabled="canApplyCategory"
        @click.stop="applyCategory"
        >{{ $t('categorizeView.applyButton') }}</v-btn
      >
      <v-btn
        :disabled="canApplyCategory"
        @click.stop="showCreateFilterDialog"
        >{{ $t('categorizeView.createFilterButton') }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, ref, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageStore } from '../stores/messageDialog';
import { useProgressStore } from '../stores/progressDialog';
import NewFilterDialog from '../components/categorize-view/NewFilterDialog.vue';
import MessageDialog from '../components/MessageDialog.vue';

const appStore = useAppStore();
const api = useApi();
const { t: $t } = useI18n();
const messageStore = useMessageStore();
const progressStore = useProgressStore();

const filters = computed(() => appStore.categorySearchHistory);
const selectedFilter = ref('');
const tableItems = ref([]);
const selectedItems = ref([]);
const filterMessage = ref('');
const selectedCategory = ref('');
const categoryNames = ref(['']);
const showNewFilterDialog = ref(false);
const selectedItemToFilter = computed(() => {
  if (selectedItems.value.length === 0) {
    return '';
  }

  for (let count = 0; count < tableItems.value.length; count += 1) {
    if (tableItems.value[count].id === selectedItems.value[0]) {
      return tableItems.value[count].description;
    }
  }

  return '';
});

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
    selectedItems.value = [];
    filterMessage.value = $t('categorizeView.transactionsFound')
      .replace('%d', tableItems.value.length)
      .replace('%d', search ?? '');
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const keyDown = (value) => {
  if (value.keyCode === 13) {
    searchTransactions();
  }
};

const getCategoriesNames = async () => {
  try {
    const dbNames = await api.categoryNames();
    categoryNames.value = dbNames.data;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const updateTransactions = async (transactions, category) => {
  progressStore.startProgress({
    steps: 0,
    description: $t('categorizeView.updateProgress'),
  });

  try {
    await api.updateTransactionsCategory(transactions, category);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressStore.stopProgress();
};

const updateTransactionsByFilter = async (filter) => {
  let updatedTransactions = 0;
  progressStore.startProgress({
    steps: 0,
    description: $t('categorizeView.updateProgress'),
  });

  try {
    updatedTransactions = await api.updateTransactionsByFilter(filter);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressStore.stopProgress();
  return updatedTransactions;
};

const applyCategory = () => {
  const category = selectedCategory.value;
  const selectedTransactions = selectedItems.value;

  messageStore.showMessage({
    title: $t('dialog.Warning'),
    message: $t('categorizeView.applyWarningMessage')
      .replace('%d', selectedTransactions.length)
      .replace('%s', category),
    yes: async () => {
      await updateTransactions(selectedTransactions, category);
      await searchTransactions();
    },
    no: () => {},
  });
};

const showCreateFilterDialog = () => {
  showNewFilterDialog.value = true;
};

const hideNewFilterDialog = () => {
  showNewFilterDialog.value = false;
};

const createNewFilter = async ({ category, filter }) => {
  hideNewFilterDialog();

  try {
    await api.createFilter(category, filter);

    messageStore.showMessage({
      title: $t('dialog.Warning'),
      message: $t('categorizeView.updateTransactionsMessage'),
      yes: async () => {
        const result = await updateTransactionsByFilter(filter);
        const tit = $t('categorizeView.updatedTransactionsMessage').replace(
          '%d',
          `${result?.data[0]?.affectedRows ?? 0}`,
        );
        messageStore.showMessage({
          title: $t('dialog.Info'),
          message: tit,
          ok: () => {},
        });
        await searchTransactions();
      },
      no: () => {},
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

onBeforeMount(() => getCategoriesNames());
</script>
