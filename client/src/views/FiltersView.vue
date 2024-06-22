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
                @update:model-value="onUpdateModelValue"
              >
                <template #[`header.data-table-select`]></template>
              </v-data-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="noneSelected"
                @click.stop="showRenameCategoryDialog"
                >{{ $t('filtersView.renameCategoryButton') }}</v-btn
              >
              <v-btn
                :disabled="noneSelected"
                @click.stop="deleteCategories"
                >{{ $t('filtersView.deleteCategoryButton') }}</v-btn
              >
              <v-btn
                :disabled="noneSelected"
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
              ></v-data-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn>{{ $t('filtersView.newFilterButton') }}</v-btn>
              <v-btn>{{ $t('filtersView.deleteFilterButton') }}</v-btn>
              <v-btn>{{ $t('filtersView.applyFilterButton') }}</v-btn>
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
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUpdate, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageStore } from '../stores/messageDialog';
import { useProgressStore } from '../stores/progressDialog';
import RenameCategoryDialog from '../components/filters-view/RenameCategoryDialog.vue';

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();
const messageStore = useMessageStore();
const progressStore = useProgressStore();

const selectedCategories = ref([]);
const tableCategories = ref([]);
const selectedFilters = ref([]);
const tableFilters = ref([]);
const showRenameCategory = ref(false);
const renameCategoryName = ref('');

const noneSelected = computed(() => {
  return selectedCategories.value.length === 0;
});

const listToTable = (list) => {
  const table = [];
  list.forEach((category) => {
    table.push({ id: category });
  });
  return table;
};

// Disable multi-selection
const onUpdateModelValue = async (updateSelectedCategories) => {
  const category = updateSelectedCategories.pop();
  if (category) {
    selectedCategories.value = [category];
    const res = await api.getFilters(category);
    tableFilters.value = res.data;
  }
};

const getCategories = async () => {
  try {
    const dbNames = await api.categoryNames();
    tableCategories.value = listToTable(dbNames.data);
    selectedCategories.value = [];
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const showRenameCategoryDialog = async () => {
  showRenameCategory.value = true;
  [renameCategoryName.value] = selectedCategories.value;
};

const deleteCategories = async () => {
  messageStore.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.deleteCategoriesWarningMessage').replace(
      '%d',
      selectedCategories.value.length,
    ),
    yes: async () => {
      progressStore.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const deleteResult = await api.deleteCategories(selectedCategories.value);
        const resetResult = await api.resetCategoryFromTransactions(selectedCategories.value);

        progressStore.stopProgress();
        messageStore.showMessage({
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

      progressStore.stopProgress();
    },
    no: () => {},
  });
};

const applyCategory = () => {
  messageStore.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.updateCategoryWarningMessage').replace(
      '%s',
      selectedCategories.value[0],
    ),
    yes: async () => {
      progressStore.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const applyResult = await api.applyCategoryToTransactions(selectedCategories.value[0]);

        progressStore.stopProgress();
        messageStore.showMessage({
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

      progressStore.stopProgress();
    },
    no: () => {},
  });
};

const renameCategory = (value) => {
  showRenameCategory.value = false;

  messageStore.showMessage({
    title: $t('dialog.Warning'),
    message: $t('filtersView.renameCategoryMessage')
      .replace('%s', renameCategoryName.value)
      .replace('%s', value.category),
    yes: async () => {
      progressStore.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });

      try {
        const result = await api.renameCategory(renameCategoryName.value, value.category);

        progressStore.stopProgress();
        messageStore.showMessage({
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

      progressStore.stopProgress();
    },
    no: () => {},
  });
};

onBeforeUpdate(() => getCategories());
onBeforeMount(() => getCategories());
</script>
