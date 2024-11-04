<template>
  <v-file-input
    :model-value="fileName"
    :label="fileNameLabel"
    accept="text/csv"
    clearable
    @click:clear="resetView"
    @change="handleFileChange"
  ></v-file-input>
  <v-footer>{{ rowCountLabel }}</v-footer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { VFileInput, VFooter } from 'vuetify/lib/components/index.mjs';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../../stores/app';

const appStore = useAppStore();
const { t: $t } = useI18n();

const emits = defineEmits(['clear']);

defineProps({
  fileName: {
    type: Array,
    default: () => [],
  },
});

const fileNameLabel = ref($t('importView.importFileInputLabel'));
const rowCountLabel = computed(() =>
  appStore.csvfile.rowCount === 0
    ? ''
    : $t('importView.rowCountLabel').replace('%d', appStore.csvfile.rowCount),
);

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const fileContent = event.target.result;

    if (appStore.csvfile.isValidCsvFile(fileContent.slice(0, 300)) === false) {
      appStore.alertMessage = $t('importView.invalidFile');
      return;
    }

    appStore.csvfile.read(fileContent);
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
  emits('clear');
};
</script>
