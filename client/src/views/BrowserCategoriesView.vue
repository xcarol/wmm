<template>
  <v-card>
    <v-card-text>
      <v-select
        v-model="selectedYear"
        :label="$t('browseCategoriesView.yearLabel')"
        :items="yearItems"
        @update:model-value="refreshRoute"
      />
      <v-row class="pl-4 pr-4">
        <v-radio-group
          :model-value="balanceView"
          inline
        >
          <v-radio
            value="incomes"
            :label="$t('browseCategoriesView.incomesLabel')"
            :disabled="selectedYear === '' || categoryViewLevel !== 'category'"
            @click.stop="showIncomes"
          />
          <v-radio
            value="expenses"
            :label="$t('browseCategoriesView.expensesLabel')"
            :disabled="selectedYear === '' || categoryViewLevel !== 'category'"
            @click.stop="showExpenses"
          />
        </v-radio-group>
        <v-btn
          :disabled="categoryViewLevel === 'category'"
          prepend-icon="$back"
          @click.stop="router.back()"
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
            :items="tableItems"
            :headers="headerDetails"
            item-value="category"
            show-select
            class="elevation-1"
            fixed-header
            :height="adjustedHeight"
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
import { ref, onBeforeMount, onBeforeUpdate, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Pie } from 'vue-chartjs';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

ChartJS.register(ArcElement, Tooltip);

const api = useApi();
const { t: $t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const adjustedHeight = ref(400); // TODO: adjust with the screen height

const yearItems = ref([]);
const selectedYear = ref('');
const selectedCategories = ref([]);
const tableItems = ref([]);
const balanceView = ref('expenses');
const categoryViewLevel = ref('category');

let expenseItems = [];
let incomeItems = [];

const headerDetails = computed(() => [
  {
    title:
      categoryViewLevel.value === 'category'
        ? $t('browseCategoriesView.categoryNameLabel')
        : $t('browseCategoriesView.filterNameLabel'),
    key: 'category',
  },
  { title: $t('browseCategoriesView.balanceLabel'), key: 'balance_formated', align: 'end' },
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
  const categories = tableItems.value;

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

const resetData = () => {
  selectedCategories.value = [];
  tableItems.value = [];
  categoryViewLevel.value = '';
  balanceView.value = '';
  incomeItems = [];
  expenseItems = [];
};

const nonCategoryBalancesToList = (balances) => {
  const balancesList = [];

  balances.data.at(0).forEach((balance) => {
    balancesList.push({ data: balance });
  });

  return balancesList;
};

const addTransactionToCategoriesList = (categoryList, transaction) => {
  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

  categoryList.push({
    category: transaction.category,
    balance: transaction.balance.toFixed(2),
    balance_formated: currencyFormatter.format(transaction.balance.toFixed(2)),
    month_average: currencyFormatter.format(transaction.avg_monthly_balance.toFixed(2)),
    color: randomColor(),
  });
};

const updateView = () => {
  const percentFormatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let totalAmount = 0.0;

  for (let count = 0; count < tableItems.value.length; count += 1) {
    const category = tableItems.value.at(count);
    if (selectedCategories.value.includes(category.category) === false) {
      totalAmount += parseFloat(category.balance);
    }
  }

  for (let count = 0; count < tableItems.value.length; count += 1) {
    const category = tableItems.value.at(count);

    if (selectedCategories.value.includes(category.category) === false) {
      category.percent = percentFormatter.format(
        ((category.balance * 100.0) / totalAmount).toFixed(2) / 100.0,
      );
    } else {
      category.percent = '';
    }
  }
};

const addTransactionsToLists = (transactions) => {
  transactions.forEach(async (result) => {
    const { data: transaction } = result;
    if (transaction.category) {
      if (transaction.balance >= 0) {
        addTransactionToCategoriesList(incomeItems, transaction);
      } else {
        addTransactionToCategoriesList(expenseItems, transaction);
      }
    }
  });
};

const requestCategoriesBalances = async (year) => {
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
  const { data } = await api.getFilters(category);

  const filterNames = data.map((d) => d.filter);
  const allBalancePromises = [];
  for (let index = 0; index < filterNames.length; index += 1) {
    allBalancePromises.push(
      api.filterBalance(category, filterNames.at(index), `${year}/01/01`, `${year}/12/31`),
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

  categoryViewLevel.value = 'category';
  try {
    addTransactionsToLists(await requestCategoriesBalances(selectedYear.value));
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();

  tableItems.value = expenseItems;

  updateView();
};

const updateViewWithSelectedCategory = async (category) => {
  resetData();

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  categoryViewLevel.value = 'filter';
  try {
    const year = selectedYear.value;
    const categoryBalances = await resquestFiltersBalances(category, year);
    const nonCategoryBalances = await api.filterBalance(
      category,
      '',
      `${year}/01/01`,
      `${year}/12/31`,
    );

    addTransactionsToLists(categoryBalances.concat(nonCategoryBalancesToList(nonCategoryBalances)));
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();

  tableItems.value = expenseItems;

  updateView();
};

const updateYears = async () => {
  try {
    const result = await api.getYears();
    yearItems.value = result.data.sort().reverse();
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const refreshRoute = () => {
  router.push({
    query: {
      year: selectedYear.value,
      view: balanceView.value,
    },
  });
};

const routeToTransactionsWithFilter = (filter) => {
  const year = selectedYear.value;
  router.push({
    name: 'browseTransactions',
    query: {
      bank: '',
      start: `${year}/01/01`,
      end: `${year}/12/31`,
      filter,
    },
  });
};

const refreshRouteWithCategory = (category) => {
  router.push({
    query: {
      year: selectedYear.value,
      view: balanceView.value,
      category,
    },
  });
};

const showIncomes = () => {
  balanceView.value = 'incomes';
  refreshRoute();
};

const showExpenses = () => {
  balanceView.value = 'expenses';
  refreshRoute();
};

const chartOptions = {
  interaction: {
    mode: 'index',
  },
  onClick: (e, item) => {
    if (!item.at(0)) {
      return;
    }

    if (categoryViewLevel.value === 'category') {
      refreshRouteWithCategory(tableItems.value.at(item.at(0).index).category);
    } else if (categoryViewLevel.value === 'filter') {
      routeToTransactionsWithFilter(tableItems.value.at(item.at(0).index).category);
    }
  },
};

const updateModelValue = () => {
  updateView();
};

const parseParams = async () => {
  const { year, view, category } = route.query;

  if (year === undefined || year?.length <= 0) {
    return;
  }

  if (yearItems.value.includes(Number.parseInt(year, 10))) {
    selectedYear.value = year;

    if (category) {
      await updateViewWithSelectedCategory(category);
    } else {
      await updateViewWithSelectedYear();
    }
  }

  if (view && view === 'incomes') {
    balanceView.value = 'incomes';
    tableItems.value = incomeItems;
    updateView();
  } else {
    balanceView.value = 'expenses';
    tableItems.value = expenseItems;
    updateView();
  }
};

const beforeMount = async () => {
  await updateYears();
  parseParams();
};

onBeforeMount(() => beforeMount());
onBeforeUpdate(() => parseParams());
</script>
