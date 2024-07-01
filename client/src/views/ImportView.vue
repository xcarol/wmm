<template>
  <file-input />
  <file-preview :has-header="firstRowIsAHeader" />
  <column-selection
    :has-header="firstRowIsAHeader"
    @check-state-changed="updateFirstRowState"
    @selected-date-column="updateSelectedDateColumn"
    @selected-description-column="updateSelectedDescriptionColumn"
    @selected-amount-column="updateSelectedAmountColumn"
  />
  <bank-selection @selected-bank="selectedBank" />
  <v-card>
    <v-card-actions>
      <v-spacer />
      <v-btn
        :disabled="formNotFilled"
        @click.stop="importFile"
        >{{ $t('importView.importButtonLabel') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';
import { useApi } from '../plugins/api';
import FileInput from '../components/import-view/FileInput.vue';
import FilePreview from '../components/import-view/FilePreview.vue';
import ColumnSelection from '../components/import-view/ColumnSelection.vue';
import BankSelection from '../components/import-view/BankSelection.vue';

dayjs.extend(customParseFormat);
dayjs.locale('es');

const { t: $t } = useI18n();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();
const api = useApi();

const firstRowIsAHeader = ref(false);
const selectedDateColumn = ref(-1);
const selectedDescriptionColumn = ref(-1);
const selectedAmountColumn = ref(-1);
const selectedBankName = ref('');

const rowsToParse = computed(() => appStore.csvfile.rowCount);
const formNotFilled = computed(() =>
  rowsToParse.value === 0
    ? true
    : selectedDateColumn.value < 0 ||
      selectedDescriptionColumn.value < 0 ||
      selectedAmountColumn.value < 0 ||
      selectedBankName.value === '',
);

const updateFirstRowState = (value) => {
  firstRowIsAHeader.value = value;
};

const updateSelectedDateColumn = (value) => {
  selectedDateColumn.value = value;
};

const updateSelectedDescriptionColumn = (value) => {
  selectedDescriptionColumn.value = value;
};

const updateSelectedAmountColumn = (value) => {
  selectedAmountColumn.value = value;
};

const selectedBank = (value) => {
  selectedBankName.value = value ?? '';
};

const BANK_LENGTH = 200;
const DESCRIPTION_LENGTH = 200;

const csvDateToSql = (date) =>
  dayjs(date, 'DD/MM/YYYY').toISOString().replace('T', ' ').replace('.000Z', '');
const csvAmountToSql = (amount) => amount.replace('.', '').replace(',', '.');

const importFile = async () => {
  const firstRow = firstRowIsAHeader.value === true ? 1 : 0;
  let rowCount = firstRow;

  progressDialog.startProgress({
    steps: appStore.csvfile.rowCount,
    description: $t('importView.importingRows')
      .replace('%d', rowCount)
      .replace('%d', appStore.csvfile.rowCount - firstRow),
  });

  try {
    for (; rowCount < appStore.csvfile.rowCount; rowCount += 1) {
      const csvRow = appStore.csvfile.rows.at(rowCount);
      // eslint-disable-next-line no-await-in-loop
      await api
        .addTransaction(
          csvDateToSql(csvRow.at(selectedDateColumn.value)),
          csvRow.at(selectedDescriptionColumn.value).slice(0, DESCRIPTION_LENGTH),
          csvAmountToSql(csvRow.at(selectedAmountColumn.value)),
          selectedBankName.value.slice(0, BANK_LENGTH),
        )
        .catch((err) => {
          throw new Error(api.getErrorMessage(err));
        });

      if (progressDialog.progressIsCancelled) {
        break;
      }

      progressDialog.updateProgress({
        step: rowCount,
        description: $t('importView.importingRows')
          .replace('%d', rowCount)
          .replace('%d', appStore.csvfile.rowCount - firstRow),
      });
    }
    appStore.alertMessage = $t('importView.importedRows').replace('%d', rowCount - firstRow);
  } catch (e) {
    appStore.alertMessage = $t('importView.importError')
      .replace('%d', e.message)
      .replace('%d', rowCount);
  }
  progressDialog.stopProgress();
};
</script>
