<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="6">
          <v-card>
            <v-card-title>{{ $t('filtersView.categoriesLabel') }}</v-card-title>
            <v-card-text>
              <v-data-table
                v-model="selectedCategories"
                :items="tableCategories"
                show-select
                class="elevation-1"
                item-key="name"
                @update:model-value="onUpdateCategoryModelValue"
              >
                <template #[`header.data-table-select`]></template>
              </v-data-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="noCategorySelected"
                @click.stop="showRenameCategoryDialog"
                >{{ $t('filtersView.renameCategoryButton') }}</v-btn
              >
              <v-btn
                :disabled="noCategorySelected"
                @click.stop="deleteCategories"
                >{{ $t('filtersView.deleteCategoryButton') }}</v-btn
              >
              <v-btn
                :disabled="noCategorySelected"
                @click.stop="applyCategory"
                >{{ $t('filtersView.applyCategoryButton') }}</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="6">
          <v-card>
            <v-card-title>{{ $t('filtersView.filtersLabel') }}</v-card-title>
            <v-card-text>
              <v-data-table
                v-model="selectedFilters"
                :items="tableFilters"
                show-select
                class="elevation-1"
                item-key="name"
                @update:model-value="onUpdateFilterModelValue"
              >
                <template #[`header.data-table-select`]></template>
              </v-data-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="noCategorySelected"
                @click.stop="showNewFilterDialog"
                >{{ $t('filtersView.newFilterButton') }}</v-btn
              >
              <v-btn
                :disabled="noFilterSelected"
                @click.stop="deleteFilter"
                >{{ $t('filtersView.deleteFilterButton') }}</v-btn
              >
              <v-btn
                :disabled="noFilterSelected"
                @click.stop="applyFilter"
                >{{ $t('filtersView.applyFilterButton') }}</v-btn
              >
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
  <rename-category-dialog
    :show="showRenameCategory"
    :category="renameCategoryName"
    @on-ok="renameCategory"
    @on-cancel="showRenameCategory = !showRenameCategory"
  />
  <new-filter-dialog
    :show="showNewFilter"
    :category="newFilterCategoryName"
    @on-ok="newFilter"
    @on-cancel="showNewFilter = !showNewFilter"
  />
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUpdate, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useProgressDialogStore } from '../stores/progressDialog';
import RenameCategoryDialog from '../components/filters-view/RenameCategoryDialog.vue';
import NewFilterDialog from '../components/categorize-view/NewFilterDialog.vue';

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();
const messageDialog = useMessageDialogStore();
const progressDialog = useProgressDialogStore();

const selectedCategories = ref([]);
const tableCategories = ref([]);
const selectedFilters = ref([]);
const tableFilters = ref([]);
const showRenameCategory = ref(false);
const renameCategoryName = ref('');
const showNewFilter = ref(false);
const newFilterCategoryName = ref('');

const noCategorySelected = computed(() => {
  return selectedCategories.value.length === 0;
});

const noFilterSelected = computed(() => {
  return selectedFilters.value.length === 0;
});

const listToTable = (list) => {
  const table = [];
  list.forEach((category) => {
    table.push({ id: category });
  });
  return table;
};

const getFilters = async () => {
  try {
    const filters = await api.getFilters(selectedCategories.value);
    tableFilters.value = listToTable(filters.data);
    selectedFilters.value = [];
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const getCategories = async () => {
  try {
    const categories = await api.categoryNames();
    tableCategories.value = listToTable(categories.data);
    selectedCategories.value = [];
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const onUpdateFilterModelValue = async (updateSelectedFilters) => {
  const filter = updateSelectedFilters.pop();
  if (filter) {
    selectedFilters.value = [filter]; // Disable multi-selection
  }
};

const onUpdateCategoryModelValue = async (updateSelectedCategories) => {
  tableFilters.value = [];
  selectedFilters.value = [];
  const category = updateSelectedCategories.pop();
  if (category) {
    selectedCategories.value = [category]; // Disable multi-selection
    getFilters();
  }
};

const showRenameCategoryDialog = async () => {
  [renameCategoryName.value] = selectedCategories.value;
  showRenameCategory.value = true;
};

const showNewFilterDialog = async () => {
  [newFilterCategoryName.value] = selectedCategories.value;
  showNewFilter.value = true;
};

const renameCategory = (value) => {
  showRenameCategory.value = false;

  messageDialog.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.renameCategoryMessage')
      .replace('%s', renameCategoryName.value)
      .replace('%s', value.category),
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const result = await api.renameCategory(renameCategoryName.value, value.category);

        progressDialog.stopProgress();
        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.updatedTransactionsMessage').replace(
            '%d',
            `${result?.data[0]?.affectedRows ?? 0}`,
          ),
          ok: () => {},
        });

        await getCategories();
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }

      progressDialog.stopProgress();
    },
    no: () => {},
  });
};

const deleteCategories = async () => {
  messageDialog.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.deleteCategoriesWarningMessage').replace(
      '%d',
      selectedCategories.value.length,
    ),
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const deleteResult = await api.deleteCategories(selectedCategories.value);
        const resetResult = await api.resetCategoryFromTransactions(selectedCategories.value);

        progressDialog.stopProgress();
        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.deletedCategoriesMessage')
            .replace('%d', `${deleteResult?.data[0]?.affectedRows ?? 0}`)
            .replace('%d', `${resetResult?.data[0]?.affectedRows ?? 0}`),
          ok: () => {},
        });

        await getCategories();
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }

      progressDialog.stopProgress();
    },
    no: () => {},
  });
};

const applyCategory = () => {
  messageDialog.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.updateCategoryWarningMessage').replace(
      '%s',
      selectedCategories.value[0],
    ),
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const applyResult = await api.applyCategoryToTransactions(selectedCategories.value[0]);

        progressDialog.stopProgress();
        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.updatedTransactionsMessage').replace(
            '%d',
            `${applyResult?.data[0]?.affectedRows ?? 0}`,
          ),
          ok: () => {},
        });

        await getCategories();
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }

      progressDialog.stopProgress();
    },
    no: () => {},
  });
};

const newFilter = async (value) => {
  showNewFilter.value = false;


  messageDialog.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.applyNewFilterWarningMessage').replace('%s', value.filter),
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        await api.createFilter(newFilterCategoryName.value, value.filter);
        const applyResult = await api.applyFilter(value.category,value.filter);
        await getFilters();
        progressDialog.stopProgress();
        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.updatedTransactionsMessage').replace(
            '%d',
            `${applyResult?.data[0]?.affectedRows ?? 0}`,
          ),
          ok: () => {},
        });
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }

      progressDialog.stopProgress();
    },
    no: () => {},
  });
};

const deleteFilter = () => {
  messageDialog.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.deleteFilterWarningMessage').replace('%s', selectedFilters.value),
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        await api.deleteFilters(selectedFilters.value);
        progressDialog.stopProgress();

        getFilters();
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }

      progressDialog.stopProgress();
    },
    no: () => {},
  });
};

const applyFilter = () => {
  messageDialog.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.applyFilterWarningMessage').replace('%s', selectedFilters.value),
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const applyResult = await api.applyFilter(selectedCategories.value[0], selectedFilters.value[0]);
        progressDialog.stopProgress();
        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.updatedTransactionsMessage').replace(
            '%d',
            `${applyResult?.data[0]?.affectedRows ?? 0}`,
          ),
          ok: () => {},
        });
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }

      progressDialog.stopProgress();
    },
    no: () => {},
  });
};

onBeforeUpdate(() => getCategories());
onBeforeMount(() => getCategories());
</script>
