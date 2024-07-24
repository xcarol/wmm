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
    <v-card-actions class="align-start">
      <v-select
        :items="banksNames"
        @update:model-value="onBankSelected"
      />
      <v-text-field
        v-model="minDate"
        class="ml-4"
        append-inner-icon="$calendar"
        :label="$t('browseTransactionsView.startDateLabel')"
        readonly
        :disabled="noBankSelected()"
        @click:append-inner="selectDate(minDate)"
      />
      <v-text-field
        v-model="maxDate"
        class="ml-4"
        append-inner-icon="$calendar"
        :label="$t('browseTransactionsView.endDateLabel')"
        readonly
        :disabled="noBankSelected()"
        @click:append-inner="selectDate(maxDate)"
      />
      <v-btn
        class="ml-4"
        :disabled="noBankSelected()"
        @click.stop="bankTransactions"
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
  <v-dialog v-model="calendarVisible">
    <v-calendar
      :initial-page="initialPage"
      :min-date="minDate"
      :max-date="maxDate"
      is-dark="system"
      @dayclick="onDateSelected"
    />
  </v-dialog>
</template>

<script setup>
import { computed, ref, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

const api = useApi();
const { t: $t, locale } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const adjustedHeight = ref(400); // TODO: adjust with the screen height
const banksBalances = ref([]);
const banksNames = ref([]);
const bankDetails = ref([]);
const calendarVisible = ref(false);
const minDate = ref('');
const maxDate = ref('');
const calendarDate = ref('');
const selectedBankName = ref('');

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

const initialPage = computed(() => {
  const dateToShow = new Date(calendarDate.value);
  return { month: dateToShow.getMonth() + 1, year: dateToShow.getFullYear() };
});

const noBankSelected = () => selectedBankName.value === '';

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
        api.bankBalance(banksNames.value.at(bankCount), minDate.value, maxDate.value),
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

const selectDate = (dateToSelect) => {
  calendarDate.value = dateToSelect;
  calendarVisible.value = true;
};

const bankTransactions = async () => {
  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    bankDetails.value = [];
    const { data } = await api.bankTransactions(selectedBankName.value);

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

const onBankSelected = async (bankName) => {
  if (bankName === '') {
    return;
  }

  selectedBankName.value = bankName;

  retrievedBalances.forEach(async (bankBalance) => {
    const { data: balance } = bankBalance;
    if (balance.bank === bankName) {
      minDate.value = balance.first_date;
      maxDate.value = balance.latest_date;
    }
  });
};

const onDateSelected = (datePicked) => {
  calendarVisible.value = false;

  const dateFormatted = `${datePicked.year}-${datePicked.month + 1}-${datePicked.day}`;
  if (calendarDate.value === minDate.value) {
    minDate.value = dateFormatted;
  } else if (calendarDate.value === maxDate.value) {
    maxDate.value = dateFormatted;
  }
};

onBeforeMount(() => getBanksBrief());
</script>
