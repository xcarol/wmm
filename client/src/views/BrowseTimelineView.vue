<template>
  <v-card>
    <v-card-actions class="align-start mt-2 mr-2">
      <v-select
        v-model="selectedCategory"
        class="ml-2"
        :items="categoriesNames"
        :label="$t('browseTimelineView.categoryLabel')"
      />
      <v-select
        v-model="selectedPeriod"
        class="ml-4"
        :items="periodsNames"
        :label="$t('browseTimelineView.periodLabel')"
      />
      <v-btn
        class="ml-4"
        :disabled="notReadyToQuery()"
        @click.stop="routeToData"
      >
        {{ $t('browseTimelineView.searchButton') }}
      </v-btn>
    </v-card-actions>
    <v-card-text v-resize="onResize">
      <v-row>
        <v-col :style="{ height: `${adjustedHeight}px` }">
          <chart
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
import { ref, computed, onBeforeMount, onBeforeUpdate, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import {
  Chart as ChartJS,
  PointElement,
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

ChartJS.register(PointElement, LineElement, CategoryScale, LinearScale, Tooltip, Legend);

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

const categoriesNames = ref([]);
const selectedCategory = ref('');
const periodsNames = ref([
  $t('browseTimelineView.yearLabel'),
  $t('browseTimelineView.monthLabel'),
  $t('browseTimelineView.dayLabel'),
  $t('browseTimelineView.unitLabel'),
]);
const selectedPeriod = ref('');
const categoryBalances = ref([]);

const notReadyToQuery = () => selectedCategory.value === '' || selectedPeriod.value === '';

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
  indexAxis: 'x',
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

const chartData = computed(() => {
  const data = [];
  const labels = [];

  for (let index = 0; index < categoryBalances.value.length; index += 1) {
    const element = categoryBalances.value[index];
    data.push(element.total_amount * -1);
    labels.push(element.transaction_count);
  }
  return {
    labels,
    datasets: [
      {
        label: 'My First Dataset',
        data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };
});

const updateTransactions = async () => {
  if (selectedCategory.value === '' || selectedPeriod.value === '') {
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
    const { data: balances } = await api.categoryTimeline(
      selectedCategory.value,
      period,
      '1970-01-01',
      dayjs().format(DATE_FORMAT),
    );

    categoryBalances.value = balances;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const routeToData = () => {
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

const beforeMount = async () => {
  await getCategories();
  parseParams();
};

const onResize = () => {
  innerHeight.value = window.innerHeight;
};

onBeforeMount(() => beforeMount());
onBeforeUpdate(() => parseParams());
onMounted(() => onResize());
</script>
