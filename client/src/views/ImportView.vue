<template>
  <v-container>
    <v-file-input
      :label="fileName"
      accept="text/csv"
      variant="outlined"
      @change="handleFileChange"
    />
  </v-container>
  <v-container>
    <v-combobox
      :label="$t('importView.dateColumnLabel')"
      :items="dateItems"
      :disabled="noFileLoaded"
      variant="outlined"
      readonly
    />
    <v-combobox
      :label="$t('importView.descriptionColumnLabel')"
      :items="descriptionItems"
      :disabled="noFileLoaded"
      variant="outlined"
      readonly
    />
    <v-combobox
      :label="$t('importView.amountColumnLabel')"
      :items="amountItems"
      :disabled="noFileLoaded"
      variant="outlined"
      readonly
    />
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCsvFile } from '../plugins/csvfile';
import { useAppStore } from '../stores/app';

const { t: $t } = useI18n();
const csvfile = useCsvFile();
const appStore = useAppStore();

const fileName = ref($t('importView.importFileInputLabel'));
const dateItems = ref([]);
const descriptionItems = ref([]);
const amountItems = ref([]);
const rowsToParse = ref(0);
const noFileLoaded = computed(() => rowsToParse.value === 0);

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const fileContent = event.target.result;

    rowsToParse.value = 0;
    
    if (csvfile.isValidCsvFile(fileContent.slice(0,300)) === false) {
      appStore.alertMessage = $t('importView.invalidFile');
      return;
    }

    csvfile.read(fileContent);
    rowsToParse.value = csvfile.csvRowCount;
  };
  reader.readAsText(file);
};

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    readFileContent(selectedFile);
  }
};
</script>
