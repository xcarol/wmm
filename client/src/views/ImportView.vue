<template>
  <v-container>
    <v-file-input
      v-model="fileName"
      :label="fileNameLabel"
      accept="text/csv"
      variant="outlined"
      clearable
      @click:clear="resetView"
      @change="handleFileChange"
    ></v-file-input>
    <v-footer>{{ rowCountLabel }}</v-footer>
  </v-container>
  <v-container>
    <v-table density="compact">
      <thead>
        <tr>
          <th
            v-for="header in tableHeaders"
            :key="header"
          >
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in tableItems"
          :key="item"
        >
          <td
            v-for="cell in item"
            :key="cell"
            class="truncate"
          >
            {{ cell }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
  <v-container>
    <v-checkbox
      v-model="firstRowIsAHeader"
      :label="$t('importView.firstRowIsAHeader')"
      :disabled="noFileLoaded"
    />
    <v-select
      v-model="selectedDateColumn"
      :label="$t('importView.dateColumnLabel')"
      :items="dateItems"
      :disabled="noFileLoaded"
      variant="outlined"
    />
    <v-select
      v-model="selectedDescriptionColumn"
      :label="$t('importView.descriptionColumnLabel')"
      :items="descriptionItems"
      :disabled="noFileLoaded"
      variant="outlined"
    />
    <v-select
      v-model="selectedAmountColumn"
      :label="$t('importView.amountColumnLabel')"
      :items="amountItems"
      :disabled="noFileLoaded"
      variant="outlined"
    />
  </v-container>
  <v-container>
    <v-combobox
      v-model="selectedBankName"
      :label="$t('importView.bankLabel')"
      :items="bankNames"
      :disabled="noFileLoaded"
      variant="outlined"
    />
  </v-container>
  <v-container>
    <v-btn
      class="align-button-right"
      :disabled="formNotFilled"
      >{{ $t('importView.importButtonLabel') }}</v-btn
    >
  </v-container>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCsvFile } from '../plugins/csvfile';
import { useAppStore } from '../stores/app';
import { useApi } from '../plugins/api';

const { t: $t } = useI18n();
const csvfile = useCsvFile();
const appStore = useAppStore();
const api = useApi();

const fileName = ref([]);
const bankNames = ref([]);
const fileNameLabel = ref($t('importView.importFileInputLabel'));
const firstRowIsAHeader = ref(false);
const selectedDateColumn = ref('');
const selectedDescriptionColumn = ref('');
const selectedAmountColumn = ref('');
const selectedBankName = ref('');

const tableRowsItems = () => {
  const items = [];
  let header = 0;

  if (firstRowIsAHeader.value === true) {
    header = 1;
  }
  for (let rowCount = header; rowCount < Math.min(csvfile.rowCount, 5); rowCount += 1) {
    const row = [];
    const csvrow = csvfile.rows.at(rowCount);
    for (let cell = 0; cell < csvfile.fieldCount; cell += 1) {
      row.push(csvrow.at(cell));
    }
    items.push(row);
  }

  return items;
};

const tableHeaderItems = () => {
  const items = [];

  if (firstRowIsAHeader.value === true) {
    const row = csvfile.rows.at(0);
    for (let n = 0; n < row.length; n += 1) {
      items.push(row.at(n));
    }
  } else {
    for (let n = 0; n < csvfile.fieldCount; n += 1) {
      items.push(n.toString());
    }
  }

  return items;
};

const columnItems = () => {
  const items = [''];

  if (firstRowIsAHeader.value === true) {
    const row = csvfile.rows.at(0);
    for (let n = 0; n < row.length; n += 1) {
      items.push(row.at(n));
    }
  } else {
    for (let n = 0; n < csvfile.fieldCount; n += 1) {
      items.push(n.toString());
    }
  }

  return items;
};

const dateColumnItems = () => {
  selectedDateColumn.value = '';
  return columnItems();
};

const descriptionColumnItems = () => {
  selectedDescriptionColumn.value = '';
  return columnItems();
};

const amountColumnItems = () => {
  selectedAmountColumn.value = '';
  return columnItems();
};

const rowsToParse = ref(0);
const dateItems = computed(() => (rowsToParse.value === 0 ? [] : dateColumnItems()));
const descriptionItems = computed(() => (rowsToParse.value === 0 ? [] : descriptionColumnItems()));
const amountItems = computed(() => (rowsToParse.value === 0 ? [] : amountColumnItems()));
const noFileLoaded = computed(() => rowsToParse.value === 0);
const tableHeaders = computed(() => (rowsToParse.value === 0 ? [] : tableHeaderItems()));
const tableItems = computed(() => (rowsToParse.value === 0 ? [] : tableRowsItems()));
const rowCountLabel = computed(() =>
  rowsToParse.value === 0 ? '' : $t('importView.rowCountLabel').replace('%d', rowsToParse.value),
);
const formNotFilled = computed(() =>
  rowsToParse.value === 0
    ? false
    : selectedDateColumn.value.length === 0 ||
      selectedDescriptionColumn.value.length === 0 ||
      selectedAmountColumn.value.length === 0 ||
      selectedBankName.value.length === 0,
);

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const fileContent = event.target.result;

    rowsToParse.value = 0;

    if (csvfile.isValidCsvFile(fileContent.slice(0, 300)) === false) {
      appStore.alertMessage = $t('importView.invalidFile');
      return;
    }

    csvfile.read(fileContent);
    rowsToParse.value = csvfile.rowCount;
  };
  reader.readAsText(file);
};

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    readFileContent(selectedFile);
  }
};

const getBankNames = async () => {
  const dbNames = await api.bankNames();
  console.log(dbNames);
  bankNames.value = dbNames.data;
};

onBeforeMount(() => getBankNames());

const resetView = () => {
  csvfile.reset();
  rowsToParse.value = 0;
};
</script>

<style scoped>
.truncate {
  max-width: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.align-button-right {
  float: right;
}
</style>
