<template>
  <new-filter-dialog
    :show="showNewFilterDialog"
    :category="selectedCategory"
    :filter="selectedItemToFilter"
    @on-ok="createNewFilter"
    @on-cancel="hideNewFilterDialog"
  />
  <v-card>
    <v-card-text>
      <v-combobox
        v-model="selectedFilter"
        :label="$t('categorizeView.filterLabel')"
        :items="filters"
        append-icon="$search"
        clearable
        @click:append="searchTransactions"
        @keydown="keyDown"
      />
      {{ filterMessage }}
    </v-card-text>
    <v-card-text v-resize="onResize">
      <v-data-table-virtual
        v-model="selectedItems"
        :items="tableItems"
        show-select
        class="elevation-1"
        item-key="name"
        fixed-header
        :height="adjustedHeight"
      ></v-data-table-virtual>
    </v-card-text>
    <v-card-actions class="align-start">
      <v-combobox
        v-model="selectedCategory"
        :label="$t('categorizeView.categoryLabel')"
        :items="categoryNames"
        clearable
        @click:append="searchTransactions"
        @keydown="keyDown"
      />
      <v-btn
        class="ml-2"
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
import { computed, ref, onBeforeMount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useProgressDialogStore } from '../stores/progressDialog';
import NewFilterDialog from '../components/categorize-view/NewFilterDialog.vue';

const appStore = useAppStore();
const api = useApi();
const { t: $t } = useI18n();
const messageDialog = useMessageDialogStore();
const progressDialog = useProgressDialogStore();

const filters = computed(() => appStore.categorySearchHistory);
const selectedFilter = ref('');
const tableItems = ref([]);
const selectedItems = ref([]);
const filterMessage = ref('');
const selectedCategory = ref('');
const categoryNames = ref(['']);
const showNewFilterDialog = ref(false);
const innerHeight = ref(0);

const adjustedHeight = computed(() => {
  return innerHeight.value - 290;
});

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

const getCategoriesNames = async () => {
  try {
    const dbNames = await api.categoriesNames();
    categoryNames.value = dbNames.data;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const searchTransactions = async () => {
  const search = selectedFilter.value;
  appStore.addSearchToCategoryHistory(search);

  try {
    await getCategoriesNames();
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

const updateTransactions = async (transactions, category) => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.updateProgress'),
  });

  try {
    await api.updateTransactionsCategory(transactions, category);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const updateTransactionsByFilter = async (filter) => {
  let updatedTransactions = 0;
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.updateProgress'),
  });

  try {
    updatedTransactions = await api.updateTransactionsByFilter(filter);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
  return updatedTransactions;
};

const applyCategory = () => {
  const category = selectedCategory.value;
  const selectedTransactions = selectedItems.value;

  messageDialog.showMessage({
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

    messageDialog.showMessage({
      title: $t('dialog.Warning'),
      message: $t('categorizeView.updateTransactionsMessage'),
      yes: async () => {
        const result = await updateTransactionsByFilter(filter);
        const tit = $t('progress.updatedTransactionsMessage').replace(
          '%d',
          `${result?.data[0]?.affectedRows ?? 0}`,
        );
        messageDialog.showMessage({
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

const onResize = () => {
  innerHeight.value = window.innerHeight;
};

onBeforeMount(() => getCategoriesNames());
onMounted(() => onResize());
</script>
