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
                :disabled="noneSelected"
                @click.stop="applyCategories"
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
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';

const api = useApi();
const appStore = useAppStore();

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
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const renameCategory = () => {

};

const deleteCategories = () => {

};

const applyCategories = () => {

};

onBeforeUpdate(() => getCategories());
onBeforeMount(() => getCategories());
</script>
