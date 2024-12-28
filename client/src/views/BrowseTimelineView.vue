<template>
  <v-card>
    <timeline-drawer
      :show="showDrawer"
      :selected-names="selectedNames"
      :selected-period="selectedPeriod"
      :selectable-names="namesForSelection"
      :filter-names="filtersNames"
      :periods-names="periodNames"
      :chart-type="chartType"
      @model-changed="showDrawer = !showDrawer"
      @type-changed="timelineTypeChange"
      @update-selected="updateSelectedItems"
      @update-period="updateSelectedPeriod"
      @close="closeDrawer"
      @update="updateChart"
    />
    <v-card-text>
      <v-row>
        <v-btn
          class="ma-1"
          @click="showDrawer = !showDrawer"
        >
          <v-icon icon="$show-drawer" />
        </v-btn>

        <v-radio-group
          :model-value="chartStyle"
          inline
          @update:model-value="changeChartStyle"
        >
          <v-radio
            :label="$t('browseTimelineView.lineStyle')"
            :value="CHART_STYLE_LINES"
          ></v-radio>
          <v-radio
            :label="$t('browseTimelineView.barStyle')"
            :value="CHART_STYLE_BARS"
          ></v-radio>
        </v-radio-group>
      </v-row>
      <v-row>
        <v-col :style="{ height: `${adjustedHeight}px` }">
          <chart
            v-if="chartStyle === CHART_STYLE_BARS"
            type="bar"
            :data="chartData"
            :options="chartOptions"
          />
          <chart
            v-if="chartStyle === CHART_STYLE_LINES"
            type="line"
            :data="chartData"
            :options="chartOptions"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onBeforeMount, onBeforeUpdate } from 'vue';
import {
  VBtn,
  VCard,
  VCardText,
  VCol,
  VIcon,
  VRadio,
  VRadioGroup,
  VRow,
} from 'vuetify/lib/components/index.mjs';
import { useI18n } from 'vue-i18n';
import { useDisplay } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  Chart as ChartJS,
  PointElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'vue-chartjs';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';
import TimelineDrawer from '../components/TimelineDrawer.vue';

ChartJS.register(
  PointElement,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const DATE_FORMAT = 'YYYY-MM-DD';
const CHART_TYPE_BANKS = 0;
const CHART_TYPE_CATEGORIES = 1;
const CHART_TYPE_FILTERS = 2;
const CHART_STYLE_BARS = 'bar';
const CHART_STYLE_LINES = 'line';
const VERY_FIRST_DATE = '1970-01-01';

const route = useRoute();
const { t: $t } = useI18n();
const router = useRouter();
const api = useApi();
const display = useDisplay();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const adjustedHeight = computed(() => appStore.viewHeight - 180);
const showDrawer = ref(false);
const chartType = ref(CHART_TYPE_BANKS);
const chartStyle = ref(CHART_STYLE_LINES);
const namesForSelection = ref([]);
const categoriesNames = ref([]);
const banksNames = ref([]);
const selectedNames = ref([]);
const selectedBanks = ref([]);
const selectedCategories = ref([]);
const filters = ref([]);
const filtersNames = ref([]);
const allPeriodNames = [
  $t('browseTimelineView.yearLabel'),
  $t('browseTimelineView.monthLabel'),
  $t('browseTimelineView.dayLabel'),
  $t('browseTimelineView.unitLabel'),
];
const allPeriodPositions = { year: 0, month: 1, day: 2, unit: 3 };
const yearPeriodName = [$t('browseTimelineView.yearLabel')];
const unitPeriodName = [$t('browseTimelineView.unitLabel')];
const periodNames = ref(allPeriodNames);
const selectedPeriod = ref($t('browseTimelineView.yearLabel'));
const selectedFilters = ref([]);
const selectedBalances = ref([]);
const yearsInBalances = ref([]);
const monthsInBalances = ref([]);
const daysInBalances = ref([]);
const banksInBalances = ref([]);
const categoriesInBalances = ref([]);

const closeDrawer = () => {
  appStore.showViewDrawer = false;
};

const getCategoryFilters = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    if (selectedCategories.value.length === 1) {
      const { data } = await api.getFilters(selectedCategories.value[0]);
      filters.value = data;
      filtersNames.value = data.map((filter) => filter.label.length ?filter.label: filter.filter);
    } else {
      filtersNames.value = [];
    }
    // const currentFilter = selectedFilters.value;
    // selectedFilters.value = filtersNames.value.includes(currentFilter) ? currentFilter : '';
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const getCategories = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const { data: categories } = await api.categoriesNames();
    categoriesNames.value = categories;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const getBanks = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingBanks'),
  });

  try {
    const { data: banks } = await api.banksNames();
    banksNames.value = banks;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#FFFFFF',
      },
      title: {
        text: '',
      },
    },
  },
};

const chartDataLabels = () => {
  const labels = [];
  if (selectedBalances.value.length === 0) {
    return labels;
  }

  chartOptions.plugins.legend.title.display = false;
  chartOptions.plugins.legend.title.text = '';

  if (selectedBalances.value.at(0).day !== undefined) {
    [
      $t('global.january'),
      $t('global.february'),
      $t('global.march'),
      $t('global.april'),
      $t('global.may'),
      $t('global.june'),
      $t('global.july'),
      $t('global.august'),
      $t('global.september'),
      $t('global.october'),
      $t('global.november'),
      $t('global.december'),
    ].forEach((month) => {
      [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
      ].forEach((day) => {
        labels.push(`${day} ${month}`);
      });
    });
  } else if (selectedBalances.value.at(0).month !== undefined) {
    chartOptions.plugins.legend.title.display = true;
    if (chartType.value === CHART_TYPE_BANKS) {
      chartOptions.plugins.legend.title.text = selectedBalances.value.at(0).bank;
    } else {
      chartOptions.plugins.legend.title.text = selectedBalances.value.at(0).category;
    }

    [
      $t('global.january'),
      $t('global.february'),
      $t('global.march'),
      $t('global.april'),
      $t('global.may'),
      $t('global.june'),
      $t('global.july'),
      $t('global.august'),
      $t('global.september'),
      $t('global.october'),
      $t('global.november'),
      $t('global.december'),
    ].forEach((month) => {
      labels.push(month);
    });
  } else {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];

      if (labels.includes(element.year) === false) {
        labels.push(element.year);
      }
    }
  }

  return labels;
};

const dayDataset = (label) => {
  const red = Math.random() * 0xff;
  const green = Math.random() * 0xff;
  const blue = Math.random() * 0xff;

  return {
    fill: false,
    tension: 0.1,
    label: `${label}`,
    backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.2)`,
    borderColor: `rgb(${red}, ${green}, ${blue})`,
    borderWidth: 1,
    data: Array(365).fill(''),
  };
};

const monthDataset = (label) => {
  const red = Math.random() * 0xff;
  const green = Math.random() * 0xff;
  const blue = Math.random() * 0xff;

  return {
    fill: false,
    tension: 0.1,
    label: `${label}`,
    backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.2)`,
    borderColor: `rgb(${red}, ${green}, ${blue})`,
    borderWidth: 1,
    data: Array(12).fill(''),
  };
};

const yearDataset = (label) => {
  const red = Math.random() * 0xff;
  const green = Math.random() * 0xff;
  const blue = Math.random() * 0xff;

  return {
    fill: false,
    tension: 0.1,
    label,
    backgroundColor: `rgb(${red}, ${green}, ${blue}, 0.2)`,
    borderColor: `rgb(${red}, ${green}, ${blue})`,
    borderWidth: 1,
    data: Array(yearsInBalances.value.length).fill(''),
  };
};

const banksDatasets = () => {
  const dailyDataset = [];
  const monthlyDataset = [];
  const yearlyDataset = [];
  let datasets = [];

  if (daysInBalances.value.length > 0) {
    yearsInBalances.value.forEach((year) => {
      dailyDataset.push(dayDataset(year));
    });
  } else if (monthsInBalances.value.length > 0) {
    yearsInBalances.value.forEach((year) => {
      monthlyDataset.push(monthDataset(year));
    });
  } else if (banksInBalances.value.length > 0) {
    banksInBalances.value.forEach((bank) => {
      yearlyDataset.push(yearDataset(bank));
    });
  } else {
    return datasets;
  }

  if (daysInBalances.value.length > 0) {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];
      const dt = dailyDataset.find((mDataset) => {
        return mDataset.label === element.year.toString();
      });
      dt.data[element.month * 31 + element.day] = element.total_amount * -1;
    }
    datasets = dailyDataset;
  } else if (monthsInBalances.value.length > 0) {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];
      const dt = monthlyDataset.find((mDataset) => {
        return mDataset.label === element.year.toString();
      });
      dt.data[element.month - 1] = element.total_amount * -1;
    }
    datasets = monthlyDataset;
  } else if (banksInBalances.value.length > 0) {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];
      const dt = yearlyDataset.find((mDataset) => {
        return mDataset.label === element.bank;
      });
      if (dt) {
        dt.data[element.year - selectedBalances.value[0].year] = element.total_amount;
      }
    }
    datasets = yearlyDataset;
  }

  return datasets;
};

const categoriesDatasets = () => {
  const monthlyDataset = [];
  const yearlyDataset = [];
  let datasets = [];

  if (monthsInBalances.value.length > 0) {
    yearsInBalances.value.forEach((year) => {
      monthlyDataset.push(monthDataset(year));
    });
  } else if (categoriesInBalances.value.length > 0) {
    categoriesInBalances.value.forEach((category) => {
      yearlyDataset.push(yearDataset(category));
    });
  } else {
    return datasets;
  }

  if (monthsInBalances.value.length > 0) {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];
      const dt = monthlyDataset.find((mDataset) => {
        return mDataset.label === element.year.toString();
      });
      dt.data[element.month - 1] = element.total_amount * -1;
    }
    datasets = monthlyDataset;
  } else if (categoriesInBalances.value.length > 0) {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];
      const dt = yearlyDataset.find((mDataset) => {
        return mDataset.label === element.category;
      });
      dt.data[element.year - selectedBalances.value[0].year] = element.total_amount * -1;
    }
    datasets = yearlyDataset;
  }

  return datasets;
};

const filterDatasets = () => {
  const dailyDataset = [];

  yearsInBalances.value.forEach((year) => {
    dailyDataset.push(dayDataset(year));
  });

  for (let index = 0; index < selectedBalances.value.length; index += 1) {
    const element = selectedBalances.value[index];
    const dt = dailyDataset.find((mDataset) => {
      return mDataset.label === element.year.toString();
    });
    dt.data[selectedBalances.value[index].month * 31 + selectedBalances.value[index].day] =
      element.amount * -1;
  }

  return dailyDataset;
};

const chartDataDatasets = () => {
  let datasets = [];

  if (selectedBalances.value.length === 0) {
    return datasets;
  }

  if (chartType.value === CHART_TYPE_BANKS) {
    datasets = banksDatasets();
  } else if (chartType.value === CHART_TYPE_CATEGORIES) {
    datasets = categoriesDatasets();
  } else if (chartType.value === CHART_TYPE_FILTERS) {
    datasets = filterDatasets();
  }

  return datasets;
};

const chartData = computed(() => {
  return {
    labels: chartDataLabels(),
    datasets: chartDataDatasets(),
  };
});

const setYearsInBalances = () => {
  yearsInBalances.value.length = 0;
  selectedBalances.value.forEach((balance) => {
    if (yearsInBalances.value.includes(balance.year) === false) {
      yearsInBalances.value.push(balance.year);
    }
  });
};

const setMonthsInBalances = () => {
  monthsInBalances.value = [];
  selectedBalances.value.forEach((balance) => {
    if (balance.month && monthsInBalances.value.includes(balance.month) === false) {
      monthsInBalances.value.push(balance.month);
    }
  });
};

const setDaysInBalances = () => {
  daysInBalances.value = [];
  selectedBalances.value.forEach((balance) => {
    if (balance.day && daysInBalances.value.includes(balance.day) === false) {
      daysInBalances.value.push(balance.day);
    }
  });
};

const setBanksInBalances = () => {
  banksInBalances.value = [];
  selectedBalances.value.forEach((balance) => {
    if (balance.bank && banksInBalances.value.includes(balance.bank) === false) {
      banksInBalances.value.push(balance.bank);
    }
  });
};

const setCategoriesInBalances = () => {
  categoriesInBalances.value = [];
  selectedBalances.value.forEach((balance) => {
    if (balance.category && categoriesInBalances.value.includes(balance.category) === false) {
      categoriesInBalances.value.push(balance.category);
    }
  });
};

const getCategoriesTimeline = async (period) => {
  const awaits = [];
  const categories = [];

  for (let index = 0; index < selectedNames.value.length; index += 1) {
    const category = selectedNames.value[index];
    awaits.push(
      api.categoryTimeline(category, period, VERY_FIRST_DATE, dayjs().format(DATE_FORMAT)),
    );
  }

  const results = await Promise.all(awaits);

  for (let index = 0; index < results.length; index += 1) {
    const { data } = results[index];
    categories.push(...data);
  }

  return categories.sort((c1, c2) => c1.year - c2.year);
};

const getCategoryFilterTimeline = async () => {
  const { data } = await api.categoryFilterTimeline(
    selectedNames.value.at(0),
    selectedFilters.value,
    VERY_FIRST_DATE,
    dayjs().format(DATE_FORMAT),
  );

  return data.sort((c1, c2) => c1.year - c2.year);
};

const getBanksTimeline = async (period) => {
  const awaits = [];
  const banks = [];

  for (let index = 0; index < selectedNames.value.length; index += 1) {
    const category = selectedNames.value[index];
    awaits.push(api.bankTimeline(category, period, VERY_FIRST_DATE, dayjs().format(DATE_FORMAT)));
  }

  const results = await Promise.all(awaits);

  for (let index = 0; index < results.length; index += 1) {
    const { data } = results[index];
    banks.push(...data);
  }

  return banks.sort((c1, c2) => c1.year - c2.year);
};

const getPeriod = (periodName) => {
  let period = 'year';

  switch (periodName) {
    case allPeriodNames.at(allPeriodPositions.month):
      period = 'month';
      break;
    case allPeriodNames.at(allPeriodPositions.day):
      period = 'day';
      break;
    case allPeriodNames.at(allPeriodPositions.unit):
      period = 'unit';
      break;
    default:
      break;
  }
  return period;
};

const getPeriodName = (period) => {
  let periodName = allPeriodNames.at(allPeriodPositions.year);

  switch (period) {
    case 'month':
      periodName = allPeriodNames.at(allPeriodPositions.month);
      break;
    case 'day':
      periodName = allPeriodNames.at(allPeriodPositions.day);
      break;
    case 'unit':
      periodName = allPeriodNames.at(allPeriodPositions.unit);
      break;
    default:
      break;
  }
  return periodName;
};

const updateTransactions = async () => {
  if (selectedPeriod.value === '') {
    return;
  }

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const period = getPeriod(selectedPeriod.value);

    if (chartType.value === CHART_TYPE_BANKS) {
      selectedBalances.value = await getBanksTimeline(period);
    } else if (chartType.value === CHART_TYPE_CATEGORIES) {
      selectedBalances.value = await getCategoriesTimeline(period);
    } else if (chartType.value === CHART_TYPE_FILTERS) {
      selectedBalances.value = await getCategoryFilterTimeline();
    }

    setYearsInBalances();
    setMonthsInBalances();
    setDaysInBalances();
    setBanksInBalances();
    setCategoriesInBalances();
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const updateDrawerSettings = () => {
  if (chartType.value === CHART_TYPE_BANKS) {
    namesForSelection.value = banksNames.value;
    selectedNames.value = selectedBanks.value;
    selectedCategories.value = [];
    selectedFilters.value = [];
  } else if (chartType.value === CHART_TYPE_CATEGORIES) {
    namesForSelection.value = categoriesNames.value;
    selectedNames.value = selectedCategories.value;
    selectedBanks.value = [];
    selectedFilters.value = [];
  } else if (chartType.value === CHART_TYPE_FILTERS) {
    namesForSelection.value = filtersNames.value;
    selectedNames.value = selectedFilters.value;
    // selectedCategories.value = [];
    selectedBanks.value = [];
  }
};

const updateChart = () => {
  closeDrawer();

  const query = {};
  if (selectedNames.value) {
    if (chartType.value === CHART_TYPE_BANKS) {
      query.bank = selectedNames.value;
    } else if (chartType.value === CHART_TYPE_CATEGORIES) {
      query.category = selectedNames.value;
    } else if (chartType.value === CHART_TYPE_FILTERS) {
      query.filter = selectedFilters.value;
    }
    selectedNames.value = [];
  }

  if (selectedPeriod.value) {
    query.period = getPeriod(selectedPeriod.value);
  }

  query.style = chartStyle.value;

  router.replace({ query });
};

const updateAvailablePeriods = () => {
  selectedPeriod.value = yearPeriodName.at(0);
  periodNames.value = allPeriodNames;

  if (selectedNames.value.length > 1) {
    // Multiple Categories or Banks
    periodNames.value = yearPeriodName;
  } else if (selectedBanks.value.length > 0) {
    // Single Bank
    periodNames.value = allPeriodNames.slice(0, -1);
  } else if (selectedCategories.value.length === 1 && selectedFilters.value.length === 0) {
    // Single Category
    periodNames.value = yearPeriodName;
  } else if (selectedFilters.value.length > 0) {
    // Single Category with Filters
    periodNames.value = unitPeriodName;
    selectedPeriod.value = unitPeriodName.at(0);
  }
};

const timelineTypeChange = async (type) => {
  chartType.value = type;
  if (type === CHART_TYPE_BANKS) {
    namesForSelection.value = banksNames.value;
    selectedNames.value = selectedBanks.value;
    filtersNames.value = [];
  } else if (type === CHART_TYPE_CATEGORIES) {
    namesForSelection.value = categoriesNames.value;
    selectedNames.value = selectedCategories.value;
    await getCategoryFilters();
  } else if (chartType.value === CHART_TYPE_FILTERS) {
    namesForSelection.value = filtersNames.value;
    selectedNames.value = selectedFilters.value;
  }
};

const updateSelectedItems = async (items) => {
  selectedCategories.value = [];
  selectedBanks.value = [];
  selectedBalances.value = [];

  if (chartType.value === CHART_TYPE_BANKS) {
    selectedBanks.value = items;
    selectedFilters.value = [];
  } else if (chartType.value === CHART_TYPE_CATEGORIES) {
    selectedCategories.value = items;
    await getCategoryFilters();
  } else if (chartType.value === CHART_TYPE_FILTERS) {
    selectedFilters.value = items;
  }
  selectedNames.value = items;
  updateAvailablePeriods();
};

const updateSelectedPeriod = (period) => {
  selectedPeriod.value = period;
};

const changeChartStyle = (type) => {
  chartStyle.value = type;
};

const parseParams = async () => {
  let update = false;
  const { bank, category, filter, period, style } = route.query;

  if (category?.length > 0 && JSON.stringify(selectedNames.value) !== JSON.stringify(category)) {
    if (typeof category === 'string') {
      selectedCategories.value = [category];
    } else {
      selectedCategories.value = category;
    }
    chartType.value = CHART_TYPE_CATEGORIES;
    selectedNames.value = selectedCategories.value;
    if (filter?.length > 0) {
    selectedFilters.value = filter;
  }
    update = true;
  } else if (bank?.length > 0 && JSON.stringify(selectedNames.value) !== JSON.stringify(bank)) {
    if (typeof bank === 'string') {
      selectedBanks.value = [bank];
    } else {
      selectedBanks.value = bank;
    }
    chartType.value = CHART_TYPE_BANKS;
    selectedNames.value = selectedBanks.value;
    update = true;
  }

  if (period?.length > 0 && selectedPeriod.value !== period) {
    selectedPeriod.value = getPeriodName(period);
    update = true;
  }

  if (style?.length > 0) {
    chartStyle.value = style;
  }

  if (update) {
    if (display.mdAndDown === true) {
      showDrawer.value = false;
    }
    updateDrawerSettings();
    updateAvailablePeriods();
    await updateTransactions();
  }

  await timelineTypeChange(category?.length > 0 ? CHART_TYPE_CATEGORIES : CHART_TYPE_BANKS);
};

const beforeUpdate = async () => {
  showDrawer.value = true;
  await parseParams();
};

const beforeMount = async () => {
  filtersNames.value = [];
  await getCategories();
  await getBanks();
  await beforeUpdate();
};

onBeforeMount(() => beforeMount());
onBeforeUpdate(() => beforeUpdate());
</script>
