<template>
  <v-card flat>
    <v-card-text>
      <v-row>
        <v-col>
          <v-btn @click.stop="searchTransactions">{{ $t('duplicatesView.searchButton') }}</v-btn>
        </v-col>
        <v-col>
          <v-spacer />
        </v-col>
        <v-col>
          <v-btn
            :disabled="noTransactionSelected"
            @click.stop="deleteTransactions"
            >{{ $t('duplicatesView.deleteButton') }}</v-btn
          >
        </v-col>
        <v-col>
          <v-btn
            :disabled="noTransactionSelected"
            @click.stop="markAsNotDuplicates"
            >{{ $t('duplicatesView.markButton') }}</v-btn
          >
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text>
      <v-data-table-virtual
        v-model="selectedItems"
        :items="tableItems"
        show-select
        class="elevation-1"
        fixed-header
      ></v-data-table-virtual>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  VBtn,
  VCard,
  VCardText,
  VCol,
  VDataTableVirtual,
  VRow,
  VSpacer,
} from 'vuetify/lib/components/index.mjs';
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

const noTransactionSelected = computed(() => {
  return !!(selectedItems.value.length === 0);
});

const searchTransactions = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingTransactions'),
  });

  try {
    const transactions = await api.duplicatedTransactions();
    tableItems.value = transactions.data;
    selectedItems.value = [];
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
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
</script>
