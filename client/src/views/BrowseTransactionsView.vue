<template>
  <v-card>
    <v-card-title>{{ $t('browseTransactionsView.bankOverview') }}</v-card-title>
    <v-card-text>
      <v-data-table
        :items="banksBalances"
        :headers="headerBanks"
        class="elevation-1"
        fixed-header
        disable-sort
        hide-default-footer
      />
    </v-card-text>
    <v-card-title>{{ $t('browseTransactionsView.bankDetail') }}</v-card-title>
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-select
            v-model="selectedBankName"
            :items="banksNames"
            :label="$t('browseTransactionsView.bankNameLabel')"
            @update:model-value="setBankSelectedAttributes"
          />
        </v-col>
        <v-col
          cols="12"
          class="flex-grow-1"
          sm="6"
          md="auto"
        >
          <v-select
            v-model="selectedCategory"
            :items="categoriesNames"
            :label="$t('browseTransactionsView.categoryLabel')"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="2"
        >
          <v-text-field
            v-model="selectedMinDate"
            append-inner-icon="$calendar"
            :label="$t('browseTransactionsView.startDateLabel')"
            @click:append-inner="showMinDateCalendar"
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          sm="6"
        >
          <v-text-field
            v-model="selectedMaxDate"
            append-inner-icon="$calendar"
            :label="$t('browseTransactionsView.endDateLabel')"
            @click:append-inner="showMaxDateCalendar"
          />
        </v-col>
        <v-col
          md="auto"
        >
          <v-btn
          block
            :disabled="notReadyToQuery()"
            @click.stop="routeToData"
          >
            {{ $t('browseTransactionsView.searchButton') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text>
      <div
        v-show="bankDetails.length"
        class="pl-4"
      >
        {{ transactionsBrief }}
      </div>
      <v-data-table-virtual
        :items="bankDetails"
        :headers="headerDetails"
        class="elevation-1"
        fixed-header
      />
    </v-card-text>
  </v-card>
  <calendar-dialog
    v-model="startDateCalendarVisible"
    :initial-page="initialStartPage"
    :min-date="minBankDate"
    :max-date="maxBankDate"
    :attributes="startDateCalendarAttributes"
    @date-selected="onStartDateSelected"
  />
  <calendar-dialog
    v-model="endDateCalendarVisible"
    :initial-page="initialEndPage"
    :min-date="minBankDate"
    :max-date="maxBankDate"
    :attributes="endDateCalendarAttributes"
    @date-selected="onEndDateSelected"
  />
</template>

<script setup>
import { computed, ref, onBeforeMount } from 'vue';
import {
  VBtn,
  VCard,
  VCardText,
  VCardTitle,
  VCol,
  VDataTable,
  VDataTableVirtual,
  VRow,
  VSelect,
  VTextField,
} from 'vuetify/lib/components/index.mjs';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';
import CalendarDialog from '../components/CalendarDialog.vue';

const DATE_FORMAT = 'YYYY-MM-DD';

const api = useApi();
const route = useRoute();
const router = useRouter();
const { t: $t, locale } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const banksBalances = ref([]);
const banksNames = ref([]);
const bankDetails = ref([]);
const minBankDate = ref('');
const maxBankDate = ref('');
const minAllBanksDate = ref('');
const maxAllBanksDate = ref('');
const categoriesNames = ref([]);
const selectedMinDate = ref('');
const selectedMaxDate = ref('');
const selectedBankName = ref('');
const selectedCategory = ref('');
const selectedFilter = ref('');
const startDateCalendarVisible = ref(false);
const endDateCalendarVisible = ref(false);
const totalTransactionsAmount = ref(0.0);

const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

let totalBanksAmount = 0.0;
let retrievedBalances = null;

const headerBanks = [
  { title: $t('browseTransactionsView.bankNameLabel'), key: 'bank' },
  { title: $t('browseTransactionsView.amountLabel'), key: 'balance' },
  { title: $t('browseTransactionsView.dateLabel'), key: 'date' },
];

const headerDetails = [
  { title: 'Id', key: 'id' },
  { title: $t('browseTransactionsView.bankNameLabel'), key: 'bank' },
  { title: $t('browseTransactionsView.dateLabel'), key: 'date' },
  { title: $t('browseTransactionsView.descriptionLabel'), key: 'description' },
  { title: $t('browseTransactionsView.categoryLabel'), key: 'category' },
  { title: $t('browseTransactionsView.amountLabel'), key: 'amount', align: 'end' },
];

const transactionsBrief = computed(() => {
  const banks = [];
  const transactions = bankDetails.value;

  transactions.forEach((transaction) => {
    if (banks.includes(transaction.bank) === false) {
      banks.push(transaction.bank);
    }
  });

  return `${$t('browseTransactionsView.bankNameLabel')}: ${banks.toString()}. ${$t('browseTransactionsView.amountLabel')}: ${currencyFormatter.format(totalTransactionsAmount.value)}. ${$t('browseTransactionsView.transactionsCountLabel')}: ${transactions.length}`;
});

const initialStartPage = computed(() => {
  const dateToShow = new Date(selectedMinDate.value);
  return { month: dateToShow.getMonth() + 1, year: dateToShow.getFullYear() };
});

const initialEndPage = computed(() => {
  const dateToShow = new Date(selectedMaxDate.value);
  return { month: dateToShow.getMonth() + 1, year: dateToShow.getFullYear() };
});

const startDateCalendarAttributes = computed(() => [
  { highlight: true, dates: selectedMinDate.value },
]);

const endDateCalendarAttributes = computed(() => [
  { highlight: true, dates: selectedMaxDate.value },
]);

const notReadyToQuery = () =>
  selectedMinDate.value === '' ||
  selectedMaxDate.value === '' ||
  Date.parse(selectedMinDate.value) > Date.parse(selectedMaxDate.value);

const getBanksBrief = async () => {
  totalBanksAmount = 0.0;

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const { data: categories } = await api.categoriesNames();
    const { data: banks } = await api.banksNames();

    categoriesNames.value = [''].concat(categories);
    banksNames.value = banks;

    const allBalancePromises = [];
    for (let bankCount = 0; bankCount < banksNames.value.length; bankCount += 1) {
      allBalancePromises.push(api.bankBalance(banksNames.value.at(bankCount)));
    }

    minAllBanksDate.value = dayjs().format(DATE_FORMAT);
    maxAllBanksDate.value = '';

    retrievedBalances = await Promise.all(allBalancePromises);
    retrievedBalances.forEach(async (result) => {
      const { data: bankBalance } = result;

      if (bankBalance.first_date < minAllBanksDate.value) {
        minAllBanksDate.value = bankBalance.first_date;
      }

      if (bankBalance.latest_date > maxAllBanksDate.value) {
        maxAllBanksDate.value = bankBalance.latest_date;
      }

      banksBalances.value.push({
        bank: bankBalance.bank,
        balance: bankBalance.balance.toFixed(2),
        date: new Date(bankBalance.latest_date).toLocaleDateString(),
      });

      totalBanksAmount += bankBalance.balance;
    });

    banksNames.value.splice(0, 0, '');
    banksBalances.value.push({
      bank: $t('browseTransactionsView.totalAmount'),
      balance: totalBanksAmount.toFixed(2),
    });

    minBankDate.value = minAllBanksDate.value;
    maxBankDate.value = maxAllBanksDate.value;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const setDefaultSelectedDates = () => {
  if (selectedMinDate.value === '') {
    selectedMinDate.value = dayjs(maxAllBanksDate.value).subtract(1, 'month').format(DATE_FORMAT);
  }

  if (selectedMaxDate.value === '') {
    selectedMaxDate.value = maxAllBanksDate.value;
  }
};

const showMinDateCalendar = () => {
  startDateCalendarVisible.value = true;
  setDefaultSelectedDates();
};

const showMaxDateCalendar = () => {
  endDateCalendarVisible.value = true;
  setDefaultSelectedDates();
};

const bankTransactions = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    bankDetails.value = [];
    totalTransactionsAmount.value = 0.0;

    const { data } = await api.bankTransactions(
      selectedBankName.value,
      selectedMinDate.value,
      selectedMaxDate.value,
      selectedCategory.value.length ? selectedCategory.value : undefined,
      selectedFilter.value.length ? selectedFilter.value : undefined,
    );

    data.forEach(async (transaction) => {
      bankDetails.value.push({
        id: transaction.id,
        bank: transaction.bank,
        date: transaction.date,
        description: transaction.description,
        category: transaction.category,
        amount: currencyFormatter.format(transaction.amount),
      });
      totalTransactionsAmount.value += transaction.amount;
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const routeToData = () => {
  const query = {};
  if (selectedBankName.value) {
    query.bank = selectedBankName.value;
  }

  if (selectedMinDate.value) {
    query.start = selectedMinDate.value;
  }

  if (selectedMaxDate.value) {
    query.end = selectedMaxDate.value;
  }

  if (selectedCategory.value) {
    query.category = selectedCategory.value;
  }

  router.replace({ query });
  bankTransactions();
};

const setBankSelectedAttributes = (bankName) => {
  if (retrievedBalances === null) {
    return;
  }

  minBankDate.value = '';
  maxBankDate.value = '';

  retrievedBalances.forEach((bankBalance) => {
    const { data: balance } = bankBalance;
    if (balance.bank === bankName) {
      const minDate = dayjs(balance.latest_date).subtract(1, 'month').format(DATE_FORMAT);
      selectedBankName.value = bankName;
      minBankDate.value = balance.first_date;
      maxBankDate.value = balance.latest_date;
      selectedMinDate.value = balance.first_date > minDate ? balance.first_date : minDate;
      selectedMaxDate.value = balance.latest_date;
    }
  });

  if (minBankDate.value === '') {
    minBankDate.value = dayjs(maxAllBanksDate.value).subtract(1, 'month').format(DATE_FORMAT);
  }

  if (maxBankDate.value === '') {
    maxBankDate.value = maxAllBanksDate.value;
  }
};

const onStartDateSelected = (date) => {
  if (Date.parse(date) < Date.parse(minBankDate.value)) {
    return;
  }
  startDateCalendarVisible.value = false;
  selectedMinDate.value = dayjs(date).format(DATE_FORMAT);
};

const onEndDateSelected = (date) => {
  if (Date.parse(date) > Date.parse(maxBankDate.value)) {
    return;
  }
  endDateCalendarVisible.value = false;
  selectedMaxDate.value = dayjs(date).format(DATE_FORMAT);
};

const parseParams = async () => {
  let update = false;
  const { bank, start, end, category, filter } = route.query;

  if (bank?.length > 0 && selectedBankName.value !== bank) {
    selectedBankName.value = bank;
    setBankSelectedAttributes();
    update = true;
  }

  if (start?.length > 0 && selectedMinDate.value !== start && Date.parse(start) > 0) {
    selectedMinDate.value = start;
    update = true;
  }

  if (end?.length > 0 && selectedMaxDate.value !== end && Date.parse(end) > 0) {
    selectedMaxDate.value = end;
    update = true;
  }

  if (category?.length > 0 && selectedCategory.value !== category) {
    selectedCategory.value = category;
    update = true;
  }

  if (filter?.length > 0 && selectedFilter.value !== filter) {
    selectedFilter.value = filter;
    update = true;
  }

  if (Date.parse(selectedMaxDate.value) < Date.parse(selectedMinDate.value)) {
    selectedMinDate.value = '';
    selectedMaxDate.value = '';
  }

  if (update) {
    bankTransactions();
  }
};

const beforeMount = async () => {
  await getBanksBrief();
  parseParams();
};

onBeforeMount(() => beforeMount());
</script>
