<template>
  <v-card>
    <v-card-text>
      <v-select
        v-model="selectedYear"
        :label="$t('browseCategoriesView.yearLabel')"
        :items="yearItems"
        @update:model-value="yearSelected"
      />
    </v-card-text>
    <v-card-text v-resize="onResize">
      <v-data-table-virtual
        v-model="selectedCategories"
        :items="tableCategories"
        item-value="category"
        show-select
        class="elevation-1"
        fixed-header
        :height="adjustedHeight"
        @update:model-value="updateModelValue"
      >
        <template #[`header.data-table-select`]></template>
      </v-data-table-virtual>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onBeforeMount, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const yearItems = ref([]);
const selectedYear = ref('');
const selectedCategories = ref([]);
const tableCategories = ref([]);
const innerHeight = ref(0);

const adjustedHeight = computed(() => {
  return innerHeight.value - 290;
});

const yearSelected = async () => {
  selectedCategories.value = [];
  tableCategories.value = [];
  let totalAmount = 0.0;

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  try {
    const { data } = await api.categoriesNames();

    const categories = data;

    const allBalancePromises = [];
    for (let categoryCount = 0; categoryCount < categories.length; categoryCount += 1) {
      allBalancePromises.push(
        api.categoryBalance(
          categories.at(categoryCount),
          `${selectedYear.value}/01/01`,
          `${selectedYear.value}/12/31`,
        ),
      );
    }

    const results = await Promise.all(allBalancePromises);

    results.forEach(async (result) => {
      totalAmount += result.data.balance;
    });

    results.forEach(async (result) => {
      const { data: categoryResult } = result;
      if (categoryResult.category) {
        tableCategories.value.push({
          category: categoryResult.category,
          balance: categoryResult.balance.toFixed(2),
          percent: (categoryResult.balance * 100.0 / totalAmount).toFixed(2),
        });
      }
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const updateYears = async () => {
  const result = await api.getYears();
  yearItems.value = result.data;
};

const onResize = () => {
  innerHeight.value = window.innerHeight;
};

const updatePercetages = () => {
  let totalAmount = 0.0;

  for (let count = 0 ; count < tableCategories.value.length ; count += 1) {
    const category = tableCategories.value.at(count);
    if (selectedCategories.value.includes(category.category) === false) {
      totalAmount += parseFloat(category.balance);
    } else {
      tableCategories.value.at(count).percent = '';
    }
  }

  for (let count = 0 ; count < tableCategories.value.length ; count += 1) {
    const category = tableCategories.value.at(count);
    if (selectedCategories.value.includes(category.category) === false) {
      tableCategories.value.at(count).percent = (category.balance * 100.0 / totalAmount).toFixed(2); 
    }
  }
};

const updateModelValue = () => {
  updatePercetages();
};

onMounted(() => onResize());
onBeforeMount(() => updateYears());
</script>
