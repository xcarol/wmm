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
  </v-card>
</template>

<script setup>
import { ref, onBeforeMount, onBeforeUpdate, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

const DATE_FORMAT = 'YYYY-MM-DD';

const route = useRoute();
const { t: $t } = useI18n();
const router = useRouter();
const api = useApi();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const innerHeight = ref(0);
const categoriesNames = ref([]);
const selectedCategory = ref('');
const periodsNames = ref([
  $t('browseTimelineView.yearLabel'),
  $t('browseTimelineView.monthLabel'),
  $t('browseTimelineView.dayLabel'),
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

const updateTransactions = async () => {
  if (selectedCategory.value === '' || selectedPeriod.value === '') {
    return;
  }

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const { data: balances } = await api.categoryBalance( selectedCategory.value, '1970-01-01', dayjs().format(DATE_FORMAT));

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
