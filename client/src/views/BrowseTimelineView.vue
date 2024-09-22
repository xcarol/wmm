<template>
  <v-card>
    <timeline-drawer
      :show="showDrawer"
      :category="selectedCategory"
      :period="selectedPeriod"
      :categories-names="categoriesNames"
      :periods-names="periodsNames"
      @category-updated="updateSelectedCategory"
      @period-updated="updateSelectedPeriod"
      @close="closeDrawer"
      @update="updateChart"
    />
    <v-card-text v-resize="onResize">
      <v-row>
        <v-col :style="{ height: `${adjustedHeight}px` }">
          <chart
            type="bar"
            :data="chartData"
            :options="chartOptions"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onBeforeMount, onBeforeUpdate, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  Chart as ChartJS,
  PointElement,
  BarElement,
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

ChartJS.register(PointElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DATE_FORMAT = 'YYYY-MM-DD';

const route = useRoute();
const { t: $t } = useI18n();
const router = useRouter();
const api = useApi();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const innerHeight = ref(0);
const adjustedHeight = computed(() => {
  return innerHeight.value - 180;
});

const showDrawer = computed(() => appStore.showViewDrawer);
const categoriesNames = ref([]);
const selectedCategory = ref('');
const periodsNames = ref([
  $t('browseTimelineView.yearLabel'),
  $t('browseTimelineView.monthLabel'),
  $t('browseTimelineView.dayLabel'),
  $t('browseTimelineView.unitLabel'),
]);
const selectedPeriod = ref('');
const selectedBalances = ref([]);
const yearsInBalances = ref([]);
const monthsInBalances = ref([]);
const banksInBalances = ref([]);
const categoriesInBalances = ref([]);

const closeDrawer = () => {
  appStore.showViewDrawer = false;
};

const getCategories = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const { data: categories } = await api.categoriesNames();

    categoriesNames.value = [''].concat(categories);
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
    },
  },
};

const chartDataLabels = () => {
  const labels = [];
  if (selectedBalances.value.length === 0) {
    return labels;
  }

  if (selectedBalances.value.at(0).month !== undefined) {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((month) => {
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

const monthDataset = (label) => {
  const red = Math.random() * 0xff;
  const green = Math.random() * 0xff;
  const blue = Math.random() * 0xff;
  
  return {
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
    label,
    backgroundColor: `rgb(${red}, ${green}, ${blue}, 0.2)`,
    borderColor: `rgb(${red}, ${green}, ${blue})`,
    borderWidth: 1,
    data: Array(yearsInBalances.value.length).fill(''),
  };
};

const chartDataDatasets = () => {
  const monthlyDataset = [];
  const yearlyDataset = [];
  let datasets = [];

  if (selectedBalances.value.length === 0) {
    return datasets;
  }

  if (monthsInBalances.value.length > 0) {
    yearsInBalances.value.forEach((year) => {
      monthlyDataset.push(monthDataset(year));
    });
  } else if (banksInBalances.value.length > 0) {
    banksInBalances.value.forEach((bank) => {
      yearlyDataset.push(bank);
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
  } else {
    for (let index = 0; index < selectedBalances.value.length; index += 1) {
      const element = selectedBalances.value[index];
      const dt = yearlyDataset.find((mDataset) => {
        return mDataset.label === element.year.toString();
      });
      dt.data[element.year - selectedBalances.value[0].year] = element.total_amount * -1;
    }
    datasets = yearlyDataset;
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

const updateTransactions = async () => {
  if (selectedPeriod.value === '') {
    return;
  }

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    let period = 'unit';
    switch (selectedPeriod.value) {
      case periodsNames.value[0]:
        period = 'year';
        break;
      case periodsNames.value[1]:
        period = 'month';
        break;
      case periodsNames.value[2]:
        period = 'day';
        break;
      default:
        break;
    }

    if (selectedCategory.value) {
      const { data: balances } = await api.categoryTimeline(
        selectedCategory.value,
        period,
        '1970-01-01',
        dayjs().format(DATE_FORMAT),
      );
      selectedBalances.value = balances;
    } else {
      const { data: balances } = await api.bankTimeline(
        period,
        '1970-01-01',
        dayjs().format(DATE_FORMAT),
      );
      selectedBalances.value = balances;
    }

    setYearsInBalances();
    setMonthsInBalances();
    setBanksInBalances();
    setCategoriesInBalances();
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const updateChart = (options) => {
  closeDrawer();

  selectedCategory.value = options.category;
  selectedPeriod.value = options.period;

  const query = {};
  if (selectedCategory.value) {
    query.category = selectedCategory.value;
  }

  if (selectedPeriod.value) {
    query.period = selectedPeriod.value;
  }

  router.replace({ query });
  updateTransactions();
};

const updateSelectedCategory = (category) => {
  selectedCategory.value = category;
};

const updateSelectedPeriod = (period) => {
  selectedPeriod.value = period;
};

const parseParams = async () => {
  let update = false;
  const { category, period } = route.query;

  if (category?.length > 0 && selectedCategory.value !== category) {
    selectedCategory.value = category;
    update = true;
  }

  if (period?.length > 0 && selectedPeriod.value !== period) {
    selectedPeriod.value = period;
    update = true;
  }

  if (update) {
    updateTransactions();
  }
};

const beforeUpdate = () => {
  appStore.showViewDrawerButton = true;
  parseParams();
};

const beforeMount = async () => {
  await getCategories();
  beforeUpdate();
};

const onResize = () => {
  innerHeight.value = window.innerHeight;
};

onBeforeMount(() => beforeMount());
onBeforeUpdate(() => beforeUpdate());
onMounted(() => onResize());
</script>
