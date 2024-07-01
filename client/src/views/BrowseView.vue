<template>
  <v-card>
    <v-card-title>{{ $t('browseView.bankOverview') }}</v-card-title>
    <v-card-text>
      <v-data-table
        v-model="selectedItems"
        :items="banksBalances"
        :headers="headerBanks"
        class="elevation-1"
        item-key="name"
        fixed-header
        disable-sort
        hide-default-footer
      >
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';

const api = useApi();
const { t: $t } = useI18n();
const appStore = useAppStore();

const selectedItems = ref([]);
const banksBalances = ref([]);
let totalAmount = 0.0;

const headerBanks = [
  { title: $t('browseView.bankNameLabel'), value: 'bank' },
  { title: $t('browseView.amountLabel'), value: 'balance' },
  { title: $t('browseView.dateLabel'), value: 'date' },
];

const getBankNames = async () => {
  totalAmount = 0.0;

  try {
    const { data: banksNames } = await api.banksNames();

    const allBalancePromises = [];
    for (let bankCount = 0; bankCount < banksNames.length; bankCount += 1) {
      allBalancePromises.push(
        api.bankBalance(banksNames[bankCount], '1970/01/01', new Date().toISOString()),
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
      bank: $t('browseView.totalAmount'),
      balance: totalAmount.toFixed(2),
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

onBeforeMount(() => getBankNames());
</script>
