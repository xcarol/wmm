<template>
  <v-card flat>
    <v-card-text>
      <file-input
        :file-name="fileName"
        @clear="resetView"
      />
      <import-settings
        :has-header="firstRowIsAHeader"
        :initial-amount="initialAmount"
        :date-column="selectedDateColumn"
        :description-column="selectedDescriptionColumn"
        :amount-column="selectedAmountColumn"
        :bank-name="selectedBankName"
        @check-state-changed="updateFirstRowState"
        @initial-amount-changed="updateInitialAmount"
        @bank-name-changed="selectedBank"
        @selected-date-column="updateSelectedDateColumn"
        @selected-description-column="updateSelectedDescriptionColumn"
        @selected-amount-column="updateSelectedAmountColumn"
      />
      <file-preview :has-header="firstRowIsAHeader" />
    </v-card-text>
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
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ref, computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';
import { useBanksStore } from '../stores/banks';
import { useProgressDialogStore } from '../stores/progressDialog';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useApi } from '../plugins/api';
import FileInput from '../components/import-view/FileInput.vue';
import FilePreview from '../components/import-view/FilePreview.vue';
import ImportSettings from '../components/import-view/ImportSettings.vue';

dayjs.extend(customParseFormat);

const { t: $t } = useI18n();
const appStore = useAppStore();
const banksStore = useBanksStore();
const progressDialog = useProgressDialogStore();
const messageDialog = useMessageDialogStore();
const api = useApi();

const fileName = ref([]);
const firstRowIsAHeader = ref(false);
const selectedDateColumn = ref('');
const selectedDescriptionColumn = ref('');
const selectedAmountColumn = ref('');
const selectedBankName = ref('');
const initialAmount = ref(0.0);

const rowsToParse = computed(() => appStore.csvfile.rowCount);
const formNotFilled = computed(() =>
  rowsToParse.value === 0
    ? true
    : selectedDateColumn.value === '' ||
      selectedDescriptionColumn.value === '' ||
      selectedAmountColumn.value === '' ||
      selectedBankName.value === '',
);

const updateFirstRowState = (value) => {
  firstRowIsAHeader.value = value;
  selectedDateColumn.value = '';
  selectedDescriptionColumn.value = '';
  selectedAmountColumn.value = '';
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

const resetView = () => {
  fileName.value = [];
  initialAmount.value = 0.0;
  firstRowIsAHeader.value = false;
  selectedDateColumn.value = '';
  selectedDescriptionColumn.value = '';
  selectedAmountColumn.value = '';
  selectedBankName.value = '';
  appStore.csvfile.reset();
};

const BANK_LENGTH = 200;
const DESCRIPTION_LENGTH = 200;

// TODO: move this logic to the server
const csvDateToSql = (date) => {
  let datejs = dayjs(date, 'DD/MM/YYYY').isValid() ? dayjs(date, 'DD/MM/YYYY') : null;

  if (datejs === null) {
    datejs = dayjs(date, 'DD-MM-YYYY').isValid() ? dayjs(date, 'DD-MM-YYYY') : null;
  }
  if (datejs === null) {
    datejs = dayjs(date, 'YYYY/MM/DD').isValid() ? dayjs(date, 'YYYY/MM/DD') : null;
  }
  if (datejs === null) {
    datejs = dayjs(date, 'YYYY-MM-DD').isValid() ? dayjs(date, 'YYYY-MM-DD') : null;
  }

  if (datejs === null) {
    datejs = dayjs(date);
  }

  return datejs.format('YYYY-MM-DD');
};

// TODO: move this logic to the server
const csvAmountToSql = (amount) => {
  let csvAmount = amount;
  const comma = ',';
  const point = '.';
  const commaSeparator = amount.split(comma);
  const pointSeparator = amount.split(point);

  if (commaSeparator.length > 1) {
    const pointIsDecimal = commaSeparator.at(commaSeparator.length - 1).split(point).length > 1;
    const commaIsDecimal = pointSeparator.at(pointSeparator.length - 1).split(comma).length > 1;

    if (pointIsDecimal) {
      csvAmount = amount.replaceAll(',', '');
    } else if (commaIsDecimal) {
      csvAmount = amount.replaceAll('.', '').replaceAll(',', '.');
    }
  }

  if (pointSeparator.length > 1) {
    const commaIsDecimal = pointSeparator.at(pointSeparator.length - 1).split(comma).length > 1;

    if (commaIsDecimal) {
      csvAmount = amount.replaceAll('.', '').replaceAll(',', '.');
    }
  }

  return parseFloat(csvAmount);
};

const updateInitialAmount = (value) => {
  initialAmount.value = csvAmountToSql(value);
};

const dayBeforeFirstDate = (csvfile, dateColumn) => {
  let dayBefore = dayjs();

  dayBefore = dayBefore.add(1, 'day');

  for (let count = 0; count < csvfile.rowCount; count += 1) {
    const rowDayjs = dayjs(csvDateToSql(csvfile.rows.at(count).at(dateColumn)));
    if (rowDayjs.isValid() && rowDayjs < dayBefore) {
      dayBefore = rowDayjs;
    }
  }

  dayBefore = dayBefore.subtract(1, 'day');

  return dayBefore.format('YYYY-MM-DD');
};

const selectedColumn = (column) => appStore.csvfile.rows.at(0).indexOf(column);

const importFileToDatabase = async () => {
  const firstRow = firstRowIsAHeader.value === true ? 1 : 0;
  let rowCount = firstRow;
  const transactions = [];
  let result = 0;

  if (initialAmount.value !== 0) {
    transactions.push({
      date: csvDateToSql(
        dayBeforeFirstDate(appStore.csvfile, selectedColumn(selectedDateColumn.value)),
      ),
      description: $t('importView.initialAmountLabel'),
      amount: initialAmount.value,
      bank: selectedBankName.value.slice(0, BANK_LENGTH),
    });
  }

  for (; rowCount < appStore.csvfile.rowCount; rowCount += 1) {
    const csvRow = appStore.csvfile.rows.at(rowCount);

    if (csvRow.length === appStore.csvfile.fieldCount) {
      transactions.push({
        date: csvDateToSql(csvRow.at(selectedColumn(selectedDateColumn.value))),
        description: csvRow
          .at(selectedColumn(selectedDescriptionColumn.value))
          .slice(0, DESCRIPTION_LENGTH),
        amount: csvAmountToSql(csvRow.at(selectedColumn(selectedAmountColumn.value))),
        bank: selectedBankName.value.slice(0, BANK_LENGTH),
      });
    }

    if (progressDialog.progressIsCancelled) {
      break;
    }
  }

  progressDialog.startProgress({
    description: $t('importView.importingRows'),
  });

  try {
    const {
      data: { affectedRows },
    } = await api.addTransactions(transactions);
    result = affectedRows;
  } catch (err) {
    appStore.alertMessage = api.getErrorMessage(err);
    result = -1;
  } finally {
    progressDialog.stopProgress();
  }

  return result;
};

const applyFiltersToDatabase = async () => {
  progressDialog.startProgress({
    steps: appStore.csvfile.rowCount,
    description: $t('progress.updateProgress'),
  });
  await api.applyFilters();
  progressDialog.stopProgress();
};

const importFile = async () => {
  const importedRows = await importFileToDatabase();

  if (importedRows > 0) {
    await applyFiltersToDatabase();
    await banksStore.fetchBanks();

    messageDialog.showMessage({
      title: $t('dialog.Info'),
      message: $t('importView.importedRows').replace('%d', importedRows),
      ok: () => {
        resetView();
      },
    });
  }
};

onBeforeMount(() => {
  appStore.csvfile.reset();
  banksStore.fetchBanks();
});
</script>
