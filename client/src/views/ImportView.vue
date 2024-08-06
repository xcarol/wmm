<template>
  <file-input :file-name="fileName" @clear="resetView" />
  <file-preview :has-header="firstRowIsAHeader" />
  <import-settings
    :has-header="firstRowIsAHeader"
    :initial-amount="initialAmount"
    :date-column="selectedDateColumn"
    :description-column="selectedDescriptionColumn"
    :amount-column="selectedAmountColumn"
    @check-state-changed="updateFirstRowState"
    @initial-amount-changed="updateInitialAmount"
    @selected-date-column="updateSelectedDateColumn"
    @selected-description-column="updateSelectedDescriptionColumn"
    @selected-amount-column="updateSelectedAmountColumn"
  />
  <bank-selection
    :bank-name="selectedBankName"
    @selected-bank="selectedBank"
  />
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
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ref, computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useApi } from '../plugins/api';
import FileInput from '../components/import-view/FileInput.vue';
import FilePreview from '../components/import-view/FilePreview.vue';
import ImportSettings from '../components/import-view/ImportSettings.vue';
import BankSelection from '../components/import-view/BankSelection.vue';

dayjs.extend(customParseFormat);

const { t: $t } = useI18n();
const appStore = useAppStore();
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

const updateInitialAmount = (value) => {
  initialAmount.value = value;
};

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

  return `${datejs.year()}-${datejs.month() + 1}-${datejs.date()}`;
};

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

const dayBeforeFirstDate = (csvfile, dateColumn) => {
  let olderDate = dayjs();

  olderDate = olderDate.add(1, 'day');

  for (let count = 0; count < csvfile.rowCount; count += 1) {
    const rowDate = csvfile.rows.at(count).at(dateColumn);
    const rowDayjs = dayjs(csvDateToSql(rowDate));
    if (dayjs(rowDate).isValid() && rowDayjs < olderDate) {
      olderDate = rowDayjs;
    }
  }

  olderDate = olderDate.subtract(1, 'day');

  return `${olderDate.year()}-${olderDate.month() + 1}-${olderDate.date()}`;
};

const selectedColumn = (column) => appStore.csvfile.rows.at(0).indexOf(column);

const importFileToDatabase = async () => {
  const firstRow = firstRowIsAHeader.value === true ? 1 : 0;
  let rowCount = firstRow;

  progressDialog.startProgress({
    steps: appStore.csvfile.rowCount,
    description: $t('importView.importingRows')
      .replace('%d', rowCount)
      .replace('%d', appStore.csvfile.rowCount - firstRow),
  });

  try {
    if (initialAmount.value !== 0) {
      await api
        .addTransaction(
          csvDateToSql(dayBeforeFirstDate(appStore.csvfile, selectedColumn(selectedDateColumn))),
          $t('importView.initialAmountLabel'),
          csvAmountToSql(initialAmount.value),
          selectedBankName.value.slice(0, BANK_LENGTH),
        )
        .catch((err) => {
          throw new Error(api.getErrorMessage(err));
        });
    }

    for (; rowCount < appStore.csvfile.rowCount; rowCount += 1) {
      const csvRow = appStore.csvfile.rows.at(rowCount);
      // eslint-disable-next-line no-await-in-loop
      await api
        .addTransaction(
          csvDateToSql(csvRow.at(selectedColumn(selectedDateColumn.value))),
          csvRow.at(selectedColumn(selectedDescriptionColumn.value)).slice(0, DESCRIPTION_LENGTH),
          csvAmountToSql(csvRow.at(selectedColumn((selectedAmountColumn.value)))),
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
  } catch (e) {
    appStore.alertMessage = $t('importView.importError')
      .replace('%d', e.message)
      .replace('%d', rowCount);
    throw e;
  }
  progressDialog.stopProgress();

  return rowCount - firstRow;
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
  await applyFiltersToDatabase();

  messageDialog.showMessage({
    title: $t('dialog.Info'),
    message: $t('importView.importedRows').replace('%d', importedRows),
    ok: () => {
      resetView();
    },
  });
};

onBeforeMount(() => appStore.csvfile.reset());
</script>
