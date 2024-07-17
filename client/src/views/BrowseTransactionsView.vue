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
    <v-card-actions>
      <v-select
        :items="banksNames"
        @update:model-value="onBankSelected"
      />
    </v-card-actions>
    <v-card-text>
      <div class="pl-4">
        {{ `${$t('browseTransactionsView.transactionsCountLabel')}: ${bankDetails.length}` }}
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
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();

const adjustedHeight = ref(400); // TODO: adjust with the screen height
const banksBalances = ref([]);
const banksNames = ref([]);
const bankDetails = ref([]);

let totalAmount = 0.0;

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
        api.bankBalance(banksNames.value.at(bankCount), '1970/01/01', new Date().toISOString()),
      );
    }

    const results = await Promise.all(allBalancePromises);

    results.forEach(async (result) => {
      const { data: bankBalance } = result;
      banksBalances.value.push({
        bank: bankBalance.bank,
        balance: bankBalance.balance.toFixed(2),
        date: new Date(bankBalance.latest_date).toLocaleDateString(),
      });

      totalAmount += bankBalance.balance;
    });

    banksBalances.value.push({
      bank: $t('browseTransactionsView.totalAmount'),
      balance: totalAmount.toFixed(2),
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

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    bankDetails.value = [];
    const { data } = await api.bankTransactions(bankName);

    data.forEach(async (transaction) => {
      bankDetails.value.push({
        id: transaction.id,
        bank: transaction.bank,
        date: new Date(transaction.date).toLocaleDateString(),
        description: transaction.description,
        category: transaction.category,
        amount: transaction.amount,
      });
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

onBeforeMount(() => getBanksBrief());
</script>
