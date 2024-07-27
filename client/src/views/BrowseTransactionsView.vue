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
    <v-card-actions class="align-start ml-4 mr-4">
      <v-select
        v-model="selectedBankName"
        :items="banksNames"
        @update:model-value="setBankSelectedAttributes"
      />
      <v-text-field
        v-model="selectedMinDate"
        class="ml-4"
        append-inner-icon="$calendar"
        :label="$t('browseTransactionsView.startDateLabel')"
        readonly
        :disabled="noBankSelected()"
        @click:append-inner="showMinDateCalendar"
      />
      <v-text-field
        v-model="selectedMaxDate"
        class="ml-4"
        append-inner-icon="$calendar"
        :label="$t('browseTransactionsView.endDateLabel')"
        readonly
        :disabled="noBankSelected()"
        @click:append-inner="showMaxDateCalendar"
      />
      <v-btn
        class="ml-4"
        :disabled="notReadyToQuery()"
        @click.stop="routeToData"
      >
        {{ $t('browseTransactionsView.searchButton') }}
      </v-btn>
    </v-card-actions>
    <v-card-text>
      <div
        v-show="bankDetails.length"
        class="pl-4"
      >
        {{
          `${$t('browseTransactionsView.bankNameLabel')}: ${selectedBankName}. ${$t('browseTransactionsView.transactionsCountLabel')}: ${bankDetails.length}`
        }}
      </div>
      <v-data-table-virtual
        :items="bankDetails"
        :headers="headerDetails"
        class="elevation-1"
        fixed-header
        :height="adjustedHeight"
      />
    </v-card-text>
  </v-card>
  <v-dialog v-model="startDateCalendarVisible">
    <v-calendar
      :initial-page="initialStartPage"
      :min-date="minBankDate"
      :max-date="maxBankDate"
      :attributes="startDateCalendarAttributes"
      is-dark="system"
      @dayclick="onStartDateSelected"
    />
  </v-dialog>
  <v-dialog v-model="endDateCalendarVisible">
    <v-calendar
      :initial-page="initialEndPage"
      :min-date="minBankDate"
      :max-date="maxBankDate"
      :attributes="endDateCalendarAttributes"
      is-dark="system"
      @dayclick="onEndDateSelected"
    />
  </v-dialog>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUpdate } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

const api = useApi();
const route = useRoute();
const router = useRouter();
const { t: $t, locale } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const adjustedHeight = ref(400); // TODO: adjust with the screen height
const banksBalances = ref([]);
const banksNames = ref([]);
const bankDetails = ref([]);
const minBankDate = ref('');
const maxBankDate = ref('');
const selectedMinDate = ref('');
const selectedMaxDate = ref('');
const selectedBankName = ref('');
const selectedCategory = ref('');
const selectedFilter = ref('');
const startDateCalendarVisible = ref(false);
const endDateCalendarVisible = ref(false);

let totalAmount = 0.0;
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

const noBankSelected = () => selectedBankName.value === '';
const notReadyToQuery = () =>
  selectedBankName.value === '' || selectedMinDate.value === '' || selectedMaxDate.value === '';

const getBanksBrief = async () => {
  totalAmount = 0.0;

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const { data } = await api.banksNames();

    banksNames.value = data;

    const allBalancePromises = [];
    for (let bankCount = 0; bankCount < banksNames.value.length; bankCount += 1) {
      allBalancePromises.push(
        api.bankBalance(banksNames.value.at(bankCount), minBankDate.value, maxBankDate.value),
      );
    }

    retrievedBalances = await Promise.all(allBalancePromises);
    retrievedBalances.forEach(async (result) => {
      const { data: bankBalance } = result;

      banksBalances.value.push({
        bank: bankBalance.bank,
        balance: bankBalance.balance.toFixed(2),
        date: new Date(bankBalance.latest_date).toLocaleDateString(),
      });

      totalAmount += bankBalance.balance;
    });

    banksNames.value.splice(0, 0, '');
    banksBalances.value.push({
      bank: $t('browseTransactionsView.totalAmount'),
      balance: totalAmount.toFixed(2),
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const showMinDateCalendar = () => {
  startDateCalendarVisible.value = true;
};

const showMaxDateCalendar = () => {
  endDateCalendarVisible.value = true;
};

const bankTransactions = async () => {
  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    bankDetails.value = [];
    const { data } = await api.bankTransactions(
      selectedBankName.value,
      selectedMinDate.value,
      selectedMaxDate.value,
      selectedCategory.value,
      selectedFilter.value,
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
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const routeToData = () => {
  router.replace({
    query: {
      bank: selectedBankName.value,
      start: selectedMinDate.value,
      end: selectedMaxDate.value,
    },
  });
  bankTransactions();
};

const setBankSelectedAttributes = (bankName) => {
  if (bankName === '' || retrievedBalances === null) {
    return;
  }

  retrievedBalances.forEach((bankBalance) => {
    const { data: balance } = bankBalance;
    if (balance.bank === bankName) {
      selectedBankName.value = bankName;
      minBankDate.value = balance.first_date;
      maxBankDate.value = balance.latest_date;
      selectedMinDate.value = balance.first_date;
      selectedMaxDate.value = balance.latest_date;
    }
  });
};

const onStartDateSelected = (date) => {
  const dateFormatted = `${date.year}-${date.month}-${date.day}`;

  if (Date.parse(dateFormatted) < Date.parse(minBankDate.value)) {
    return;
  }
  startDateCalendarVisible.value = false;
  selectedMinDate.value = dateFormatted;
};

const onEndDateSelected = (date) => {
  const dateFormatted = `${date.year}-${date.month}-${date.day}`;

  if (Date.parse(dateFormatted) > Date.parse(maxBankDate.value)) {
    return;
  }
  endDateCalendarVisible.value = false;
  selectedMaxDate.value = dateFormatted;
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
onBeforeUpdate(() => parseParams());
</script>
