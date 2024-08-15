<template>
  <new-filter-dialog
    :show="showNewFilterDialog"
    :category="selectedCategory"
    :filter="selectedItemToFilter"
    :label="selectedItemToFilter"
    @on-ok="createNewFilter"
    @on-cancel="hideNewFilterDialog"
  />
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="8">
          <v-combobox
            v-model="filterText"
            :label="$t('categorizeView.filterLabel')"
            :items="filters"
            clearable
            @keydown="keyDown"
          />
        </v-col>
        <v-col cols="4">
          <v-combobox
            v-model="filterCategory"
            :label="$t('categorizeView.filterCategoryLabel')"
            :items="categoryNames"
            append-icon="$search"
            clearable
            @click:append="searchSelectedTransactions"
            @keydown="keyDown"
          />
        </v-col>
      </v-row>
      {{ filterMessage }}
    </v-card-text>
    <v-card-text v-resize="onResize">
      <transaction-table
        :selected-items="selectedItems"
        :table-items="tableItems"
        :height="autoHeight"
        @update-model-value="updateModelValue"
      />
    </v-card-text>
    <v-card-actions class="align-start">
      <v-combobox
        v-model="selectedCategory"
        class="ml-2"
        :label="$t('categorizeView.categoryLabel')"
        :items="categoryNames"
        clearable
      />
      <v-btn
        class="ml-2"
        :disabled="canApplyCategory"
        @click.stop="applyCategory"
        >{{ $t('categorizeView.applyButton') }}</v-btn
      >
      <v-btn
        class="mr-2"
        :disabled="canCreateCategory"
        @click.stop="showCreateFilterDialog"
        >{{ $t('categorizeView.createFilterButton') }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUpdate } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { _ } from 'lodash';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useProgressDialogStore } from '../stores/progressDialog';
import { getCategoriesNames } from '../models/filters';
import { categorizeUrlPath } from '../models/categorize';
import NewFilterDialog from '../components/categorize-view/NewFilterDialog.vue';
import TransactionTable from '../components/categorize-view/TransactionTable.vue';

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const api = useApi();
const { t: $t } = useI18n();
const messageDialog = useMessageDialogStore();
const progressDialog = useProgressDialogStore();

const filters = computed(() => appStore.categorySearchHistory);
const filterText = ref('');
const filterCategory = ref('');
const tableItems = ref([]);
const selectedItems = ref([]);
const filterMessage = ref('');
const selectedCategory = ref('');
const categoryNames = ref(['']);
const showNewFilterDialog = ref(false);
const innerHeight = ref(0);

const autoHeight = computed(() => {
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

const canCreateCategory = computed(() => {
  return !!(selectedItems.value.length !== 1);
});

const updateModelValue = (modelValue) => {
  selectedItems.value = modelValue;
};

const updateFilterMessage = (filter, category) => {
  filterMessage.value = $t('categorizeView.transactionsFound').replace(
    '%d',
    tableItems.value.length,
  );

  if (filter) {
    filterMessage.value += $t('categorizeView.transactionsFoundFilter').replace('%s', filter);
  }

  if (category) {
    filterMessage.value += $t('categorizeView.transactionsFoundCategory').replace('%s', category);
  }
};

const routeChanged = () => {
  const { category: qcategory, filter: qfilter } = route.query;

  if (
    _.toString(filterText.value) !== _.toString(qfilter) ||
    _.toString(filterCategory.value) !== _.toString(qcategory)
  ) {
    return true;
  }

  return false;
};

const searchTransactions = async (filter, category) => {
  appStore.addSearchToCategoryHistory(filter);

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    categoryNames.value = await getCategoriesNames();
    const transactions = await api.searchTransactions(filter, category);
    tableItems.value = transactions.data;
    selectedItems.value = [];
    updateFilterMessage(filter, category);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const searchSelectedTransactions = async () => {
  const category = filterCategory.value;
  const filter = filterText.value;

  if (routeChanged()) {
    tableItems.value = [];
    router.push(categorizeUrlPath(filter, category));
  } else {
    searchTransactions(filter, category);
  }
};

const keyDown = (value) => {
  if (value.keyCode === 13) {
    searchSelectedTransactions();
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

const transactionFromId = (id) => {
  for (let index = 0; index < tableItems.value.length; index += 1) {
    const transaction = tableItems.value[index];
    if (transaction.id === id) {
      return transaction;
    }
  }
  return { description: 'unknown', amount: 'unknown' };
};

const applyWarningMessage = () => {
  let messageTable = '';

  for (let index = 0; index < selectedItems.value.length; index += 1) {
    const transaction = transactionFromId(selectedItems.value[index]);
    messageTable += $t('categorizeView.applyWarningMessageItem')
      .replace('%s', transaction.description)
      .replace('%d', transaction.amount);
  }

  return messageTable;
};

const applyCategory = () => {
  const category = selectedCategory.value;
  const selectedTransactions = selectedItems.value;

  messageDialog.showMessage({
    title: $t('categorizeView.applyWarningTitle').replace('%s', category.toLocaleUpperCase()),
    message: applyWarningMessage(),
    yes: async () => {
      await updateTransactions(selectedTransactions, category);
      selectedCategory.value = '';
      filterText.value = '';
      filterCategory.value = '';
      searchSelectedTransactions();
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

const createNewFilter = async ({ category, filter, label }) => {
  hideNewFilterDialog();

  try {
    await api.createFilter(category, filter, label);
    await api.applyFilters();
    await searchTransactions(filterText.value, filterCategory.value);
    selectedCategory.value = '';
    selectedItems.value = [];
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const onResize = () => {
  innerHeight.value = window.innerHeight;
};

const beforeUpdate = () => {
  onResize();

  const { category: qcategory, filter: qfilter } = route.query;

  if (routeChanged() || tableItems.value.length === 0) {
    filterText.value = qfilter;
    filterCategory.value = qcategory;
    searchTransactions(qfilter, qcategory);
  }
};

const beforeMount = async () => {
  categoryNames.value = await getCategoriesNames();
  if (route.query.filter || route.query.category) {
    beforeUpdate();
  }
};

onBeforeMount(() => beforeMount());
onBeforeUpdate(() => beforeUpdate());
</script>
