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
  </v-card>
</template>

<script setup>
import {
  VCard,
  VCardText,
  VCardTitle,
  VDataTable,
} from 'vuetify/lib/components/index.mjs';
import { onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProgressDialogStore } from '../stores/progressDialog';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';

const { t: $t } = useI18n();
const progressDialog = useProgressDialogStore();
const api = useApi();
const appStore = useAppStore();

const banksBalances = ref([]);

const headerBanks = [
  { title: $t('browseTransactionsView.bankNameLabel'), key: 'bank' },
  { title: $t('browseTransactionsView.amountLabel'), key: 'balance' },
  { title: $t('browseTransactionsView.dateLabel'), key: 'date' },
];

const getBanksBrief = async () => {
  let totalBanksAmount = 0.0;

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingBanks'),
  });

  try {
    const { data: banks } = await api.banksNames();

    const allBalancePromises = [];
    for (let bankCount = 0; bankCount < banks.length; bankCount += 1) {
      allBalancePromises.push(api.bankBalance(banks.at(bankCount)));
    }

    const retrievedBalances = await Promise.all(allBalancePromises);
    retrievedBalances.forEach(async (result) => {
      const { data: bankBalance } = result;

      banksBalances.value.push({
        bank: bankBalance.bank,
        balance: bankBalance.balance.toFixed(2),
        date: new Date(bankBalance.latest_date).toLocaleDateString(),
      });

      totalBanksAmount += bankBalance.balance;
    });

    banks.splice(0, 0, '');
    banksBalances.value.push({
      bank: $t('browseTransactionsView.totalAmount'),
      balance: totalBanksAmount.toFixed(2),
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

onBeforeMount(() => {
  getBanksBrief();
});
</script>