<template>
  <v-card>
    <v-card-text>
      <v-select
        v-model="selectedYear"
        :label="$t('browseCategoriesView.yearLabel')"
        :items="yearItems"
        @update:model-value="updateViewWithSelectedYear"
      />
      <v-row class="pl-4 pr-4">
        <v-radio-group
          v-model="balanceView"
          inline
        >
          <v-radio
            value="incomes"
            :label="$t('browseCategoriesView.incomesLabel')"
            :disabled="selectedYear === ''"
            @click.stop="showIncomes"
          />
          <v-radio
            value="expenses"
            :label="$t('browseCategoriesView.expensesLabel')"
            :disabled="selectedYear === ''"
            @click.stop="showExpenses"
          />
        </v-radio-group>
        <v-btn
          :disabled="categoryView === 'category'"
          prepend-icon="$back"
          @click.stop="updateViewWithCategories"
        >
          {{ $t('browseCategoriesView.backToCategories') }}
        </v-btn>
      </v-row>
    </v-card-text>
    <v-card-text v-show="selectedYear">
      <v-row>
        <v-col cols="6">
          <v-data-table-virtual
            v-model="selectedCategories"
            :items="tableCategories"
            :headers="headerDetails"
            item-value="category"
            show-select
            class="elevation-1"
            fixed-header
            @update:model-value="updateModelValue"
          >
            <template #[`header.data-table-select`]></template>
          </v-data-table-virtual>
        </v-col>
        <v-col cols="6">
          <pie
            :data="chartData"
            :options="chartOptions"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onBeforeMount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Pie } from 'vue-chartjs';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

ChartJS.register(ArcElement, Tooltip);

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const yearItems = ref([]);
const selectedYear = ref('');
const selectedCategories = ref([]);
const tableCategories = ref([]);
const balanceView = ref('');
const categoryView = ref('category');

let totalIncomeAmount = 0.0;
let totalExpenseAmount = 0.0;
let expenseCategories = [];
let incomeCategories = [];

const headerDetails = computed(() => [
  {
    title:
      categoryView.value === 'category'
        ? $t('browseCategoriesView.categoryNameLabel')
        : $t('browseCategoriesView.filterNameLabel'),
    key: 'category',
  },
  { title: $t('browseCategoriesView.balanceLabel'), key: 'balance', align: 'end' },
  { title: $t('browseCategoriesView.percentLabel'), key: 'percent', align: 'end' },
  { title: $t('browseCategoriesView.monthAverageLabel'), key: 'month_average', align: 'end' },
]);

const randomColor = () => {
  const red = ((Math.random() % 0xdd) * 100 + 0x22).toString(16).toUpperCase().slice(0, 2);
  const green = ((Math.random() % 0xdd) * 100 + 0x22).toString(16).toUpperCase().slice(0, 2);
  const blue = ((Math.random() % 0xdd) * 100 + 0x22).toString(16).toUpperCase().slice(0, 2);

  return `#${red}${green}${blue}`;
};

const chartData = computed(() => {
  const selected = selectedCategories.value;
  const categories = tableCategories.value;

  const labels = [];
  const backgroundColor = [];
  const data = [];

  for (let count = 0; count < categories.length; count += 1) {
    const category = categories.at(count);
    if (selected.includes(category.category) === false) {
      labels.push(category.category);
      backgroundColor.push(category.color);
      data.push(category.balance);
    }
  }

  return { labels, datasets: [{ backgroundColor, data }] };
});

const showIncomes = () => {
  tableCategories.value = incomeCategories;
};

const showExpenses = () => {
  tableCategories.value = expenseCategories;
};

const resetData = () => {
  selectedCategories.value = [];
  tableCategories.value = [];
  incomeCategories = [];
  expenseCategories = [];
  totalExpenseAmount = 0.0;
  totalIncomeAmount = 0.0;
};

const addTransaction = (category, transaction, totalAmount) => {
  category.push({
    category: transaction.category,
    balance: transaction.balance.toFixed(2),
    percent: ((transaction.balance * 100.0) / totalAmount).toFixed(2),
    month_average: transaction.avg_monthly_balance.toFixed(2),
    color: randomColor(),
  });
};

const updateView = () => {
  let totalAmount = 0.0;

  for (let count = 0; count < tableCategories.value.length; count += 1) {
    const category = tableCategories.value.at(count);
    if (selectedCategories.value.includes(category.category) === false) {
      totalAmount += parseFloat(category.balance);
    } else {
      tableCategories.value.at(count).percent = '';
    }
  }

  for (let count = 0; count < tableCategories.value.length; count += 1) {
    const category = tableCategories.value.at(count);
    if (selectedCategories.value.includes(category.category) === false) {
      tableCategories.value.at(count).percent = ((category.balance * 100.0) / totalAmount).toFixed(
        2,
      );
    }
  }
};

const computeAmounts = (balances) => {
  balances.forEach(({ data: { balance } }) => {
    if (balance >= 0) {
      totalIncomeAmount += balance;
    } else {
      totalExpenseAmount += balance;
    }
  });
};

const addTransactions = (transactions) => {
  transactions.forEach(async (result) => {
    const { data: transaction } = result;
    if (transaction.category) {
      if (transaction.balance >= 0) {
        addTransaction(incomeCategories, transaction, totalIncomeAmount);
      } else {
        addTransaction(expenseCategories, transaction, totalExpenseAmount);
      }
    }
  });
};

const resquestBalances = async (year) => {
  const { data } = await api.categoriesNames();

  const categories = data;
  const allBalancePromises = [];
  for (let categoryCount = 0; categoryCount < categories.length; categoryCount += 1) {
    allBalancePromises.push(
      api.categoryBalance(categories.at(categoryCount), `${year}/01/01`, `${year}/12/31`),
    );
  }

  return Promise.all(allBalancePromises);
};

const resquestFiltersBalances = async (category, year) => {
  const { data } = await api.filtersNames(category);

  const filters = data;
  const allBalancePromises = [];
  for (let filterCount = 0; filterCount < filters.length; filterCount += 1) {
    allBalancePromises.push(
      api.filterBalance(category, filters.at(filterCount), `${year}/01/01`, `${year}/12/31`),
    );
  }

  return Promise.all(allBalancePromises);
};

const updateViewWithSelectedYear = async () => {
  resetData();

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  categoryView.value = 'category';
  try {
    const balances = await resquestBalances(selectedYear.value);

    computeAmounts(balances);
    addTransactions(balances);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();

  balanceView.value = 'expenses';
  tableCategories.value = expenseCategories;

  updateView();
};

const categorySelected = async (category) => {
  resetData();

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  categoryView.value = 'filter';
  try {
    const year = selectedYear.value;
    const categoryBalances = await resquestFiltersBalances(category, year);
    const noCategoryBalances = await api.filterBalance(
      category,
      '',
      `${year}/01/01`,
      `${year}/12/31`,
    );

    const normalizedNoCategoryBalances = [];
    
    noCategoryBalances.data.at(0).forEach((entry) => {
      normalizedNoCategoryBalances.push({ data: entry });
    });

    const theUltimateList = categoryBalances.concat(normalizedNoCategoryBalances);
    computeAmounts(theUltimateList);
    addTransactions(theUltimateList);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();

  balanceView.value = 'expenses';
  tableCategories.value = expenseCategories;

  updateView();
};

const chartOptions = {
  interaction: {
    mode: 'index',
  },
  onClick: (e, item) => {
    if (categoryView.value === 'category') {
      categorySelected(tableCategories.value.at(item.at(0).index).category);
    }
  },
};

const updateYears = async () => {
  try {
    const result = await api.getYears();
    yearItems.value = result.data.sort().reverse();
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const updateViewWithCategories = () => {
  categoryView.value = 'category';
  updateViewWithSelectedYear();
};

const updateModelValue = () => {
  updateView();
};

onBeforeMount(() => updateYears());
</script>
