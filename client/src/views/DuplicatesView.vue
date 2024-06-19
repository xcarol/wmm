<template>
  <v-card>
    <v-card-text>
      <v-btn @click.stop="searchTransactions">{{ $t('duplicatesView.searchButton') }}</v-btn>
      <v-spacer />
    </v-card-text>
    <v-card-text>
      <v-data-table
        v-model="selectedItems"
        :items="tableItems"
        show-select
        class="elevation-1"
        item-key="name"
      ></v-data-table>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        :disabled="noTransactionSelected"
        @click.stop="markAsNotDuplicates"
        >{{ $t('duplicatesView.markButton') }}</v-btn
      >
      <v-btn
        :disabled="noTransactionSelected"
        @click.stop="deleteTransactions"
        >{{ $t('duplicatesView.deleteButton') }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageStore } from '../stores/messageDialog';
import { useProgressStore } from '../stores/progressDialog';

const appStore = useAppStore();
const api = useApi();
const { t: $t } = useI18n();
const messageStore = useMessageStore();
const progressStore = useProgressStore();

const tableItems = ref([]);
const selectedItems = ref([]);

const noTransactionSelected = computed(() => {
  return !!(selectedItems.value.length === 0);
});

const searchTransactions = async () => {
  try {
    const transactions = await api.duplicatedTransactions();
    tableItems.value = transactions.data;
    selectedItems.value = [];
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const markAsNotDuplicates = async () => {
  progressStore.startProgress({
    steps: 0,
    description: $t('progress.updateProgress'),
  });

  try {
    const result = await api.markTransactionsAsNotDuplicated(selectedItems.value);

    messageStore.showMessage({
      title: $t('dialog.Info'),
      message: $t('progress.updatedTransactionsMessage').replace(
      '%d',
      `${result?.data[0]?.affectedRows ?? 0}`,
    ),
      ok: () => {},
    });

    await searchTransactions();
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressStore.stopProgress();
};

const deleteTransactions = async () => {};
</script>
