<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="6">
          <v-card>
            <v-card-title>{{ $t('filtersView.categoriesLabel') }}</v-card-title>
            <v-card-text>
              <v-table>
                <v-data-table
                  v-model="selectedCategories"
                  :items="tableCategories"
                  show-select
                  class="elevation-1"
                  item-key="name"
                ></v-data-table>
              </v-table>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="manySelected"
                @click.stop="renameCategory"
                >{{ $t('filtersView.renameCategoryButton') }}</v-btn
              >
              <v-btn
                :disabled="noneSelected"
                @click.stop="deleteCategories"
                >{{ $t('filtersView.deleteCategoryButton') }}</v-btn
              >
              <v-btn
                :disabled="manySelected"
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
</template>

<script setup>
import { computed, onBeforeMount, onBeforeUpdate, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageStore } from '../stores/messageDialog';
import { useProgressStore } from '../stores/progressDialog';

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();
const messageStore = useMessageStore();
const progressStore = useProgressStore();

const selectedCategories = ref([]);
const tableCategories = ref([]);
const selectedFilters = ref([]);
const tableFilters = ref([]);

const noneSelected = computed(() => {
  return selectedCategories.value.length === 0;
});

const manySelected = computed(() => {
  return selectedCategories.value.length !== 1;
});

const listToTable = (list) => {
  const table = [];
  list.forEach((category) => {
    table.push({ id: category });
  });
  return table;
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

const renameCategory = async () => {
};

const deleteCategories = async () => {
  try {
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
      },
      no: () => {},
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressStore.stopProgress();
};

const applyCategory = () => {
  try {
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
      },
      no: () => {},
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressStore.stopProgress();
};

onBeforeUpdate(() => getCategories());
onBeforeMount(() => getCategories());
</script>
