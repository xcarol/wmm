<template>
  <v-btn
    variant="tonal"
    @click.stop="executeBackup"
    >{{ $t('sqlView.backupButton') }}</v-btn
  >
  <v-btn
    variant="tonal"
    @click.stop="executeRestore"
    >{{ $t('sqlView.restoreButton') }}</v-btn
  >
  <input
    id="fileInput"
    type="file"
    hidden
    @change="handleFileChange"
  />
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useApi } from '../../plugins/api';
import { useAppStore } from '../../stores/app';

const { t: $t } = useI18n();
const appStore = useAppStore();
const api = useApi();

const emits = defineEmits(['operationStatus']);

const executeBackup = async () => {
  appStore.startProgress({ steps: 0, description: $t('sqlView.backupProgress') });
  try {
    const res = await api.backupDatabase();
    const { data } = res;
    const fileBlob = new Blob([data], { type: res.headers['content-type'] });
    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    const date = new Date();

    const name = `wmm-${date
      .toISOString()
      .replace('T', '-')
      .replace(/\.\d+Z$/, '')}.sql`;
    a.style.display = 'none';
    a.href = url;
    a.download = name;
    document.body.appendChild(a);

    appStore.stopProgress();
    a.click();

    window.URL.revokeObjectURL(url);

    emits(
      'operationStatus',
      $t('sqlView.result').replace('%d', res.status).replace('%d', res.statusText),
    );
  } catch (e) {
    emits('operationStatus', e.response?.data ?? e);
  }
  appStore.stopProgress();
};

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = async (event) => {
    const fileContent = event.target.result;

    appStore.startProgress({ steps: 0, description: $t('sqlView.executingQuery') });
    try {
      const res = await api.executeQuery(fileContent);
      emits(
        'operationStatus',
        $t('sqlView.result').replace('%d', res.status).replace('%d', res.statusText),
      );
    } catch (e) {
      emits('operationStatus', e.response?.data ?? e);
    }
    appStore.stopProgress();
  };
  reader.readAsText(file);
};

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    readFileContent(selectedFile);
  }
};

const executeRestore = () => {
  document.getElementById('fileInput').click();
};
</script>
