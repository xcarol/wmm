<template>
  <new-filter-dialog
    :show="showNewFilterDialog"
    category=""
    filter=""
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

const getCategoriesNames = async () => {
  try {
    const dbNames = await api.categoryNames();
    categoryNames.value = dbNames.data;
  } catch (e) {
    appStore.alertMessage = e.response?.data ?? e;
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
    appStore.alertMessage = e.response?.data ?? e;
  }

  progressStore.stopProgress();
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

const createNewFilter = ({category, filter}) => {
  console.log(category);
  console.log(filter);
  hideNewFilterDialog();
};

onBeforeMount(() => getCategoriesNames());
</script>
