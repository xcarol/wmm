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
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../../stores/app';

const appStore = useAppStore();
const { t: $t } = useI18n();

const fileName = ref([]);
const fileNameLabel = ref($t('importView.importFileInputLabel'));
const rowsToParse = ref(0);
const rowCountLabel = computed(() =>
  rowsToParse.value === 0 ? '' : $t('importView.rowCountLabel').replace('%d', rowsToParse.value),
);

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const fileContent = event.target.result;

    rowsToParse.value = 0;

    if (appStore.csvfile.isValidCsvFile(fileContent.slice(0, 300)) === false) {
      appStore.alertMessage = $t('importView.invalidFile');
      return;
    }

    appStore.csvfile.read(fileContent);
    rowsToParse.value = appStore.csvfile.rowCount;
  };
  reader.readAsText(file);
};

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    readFileContent(selectedFile);
  }
};

const resetView = () => {
  appStore.csvfile.reset();
  rowsToParse.value = 0;
};
</script>
