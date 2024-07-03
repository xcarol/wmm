<template>
  <v-card>
    <v-card-text>
      <v-btn @click.stop="searchTransactions">{{ $t('duplicatesView.searchButton') }}</v-btn>
      <v-spacer />
    </v-card-text>
    <v-card-text v-resize="onResize">
      <v-data-table-virtual
        v-model="selectedItems"
        :items="tableItems"
        show-select
        class="elevation-1"
        fixed-header
        :height="adjustedHeight"
        ></v-data-table-virtual>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        :disabled="noTransactionSelected"
        @click.stop="deleteTransactions"
        >{{ $t('duplicatesView.deleteButton') }}</v-btn
      >
      <v-btn
        :disabled="noTransactionSelected"
        @click.stop="markAsNotDuplicates"
        >{{ $t('duplicatesView.markButton') }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useProgressDialogStore } from '../stores/progressDialog';

const appStore = useAppStore();
const api = useApi();
const { t: $t } = useI18n();
const messageDialog = useMessageDialogStore();
const progressDialog = useProgressDialogStore();

const tableItems = ref([]);
const selectedItems = ref([]);
const innerHeight = ref(0);

const adjustedHeight = computed(() => {
  return innerHeight.value - 220;
});

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
  try {
    messageDialog.showMessage({
      title: $t('dialog.Warning'),
      message: $t('duplicatesView.markWarningMessage').replace('%d', selectedItems.value.length),
      yes: async () => {
        progressDialog.startProgress({
          steps: 0,
          description: $t('progress.updateProgress'),
        });

        const result = await api.markTransactionsAsNotDuplicated(selectedItems.value);

        progressDialog.stopProgress();

        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.updatedTransactionsMessage').replace(
            '%d',
            `${result?.data[0]?.affectedRows ?? 0}`,
          ),
          ok: () => {},
        });

        await searchTransactions();
      },
      no: () => {},
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const deleteTransactions = async () => {
  try {
    messageDialog.showMessage({
      title: $t('dialog.Warning'),
      message: $t('duplicatesView.deleteWarningMessage').replace('%d', selectedItems.value.length),
      yes: async () => {
        progressDialog.startProgress({
          steps: 0,
          description: $t('progress.updateProgress'),
        });

        const result = await api.deleteTransactions(selectedItems.value);

        progressDialog.stopProgress();

        messageDialog.showMessage({
          title: $t('dialog.Info'),
          message: $t('progress.deletedTransactionsMessage').replace(
            '%d',
            `${result?.data[0]?.affectedRows ?? 0}`,
          ),
          ok: () => {},
        });

        await searchTransactions();
      },
      no: () => {},
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const onResize = () => {
  innerHeight.value = window.innerHeight;
};

onMounted(() => onResize());
</script>
