<template>
  <v-btn
    @click.stop="executeBackup"
    >{{ $t('sqlView.backupButton') }}</v-btn
  >
  <v-btn
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
import { useProgressStore } from '../../stores/progressDialog';

const { t: $t } = useI18n();
const progressStore = useProgressStore();
const api = useApi();

const emits = defineEmits(['operationStatus']);

const executeBackup = async () => {
  progressStore.startProgress({ steps: 0, description: $t('sqlView.backupProgress') });
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

    progressStore.stopProgress();
    a.click();

    window.URL.revokeObjectURL(url);

    emits(
      'operationStatus',
      $t('sqlView.result').replace('%d', res.status).replace('%d', res.statusText),
    );
  } catch (e) {
    emits('operationStatus', e.response?.data ?? e);
  }
  progressStore.stopProgress();
};

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = async (event) => {
    const fileContent = event.target.result;

    progressStore.startProgress({ steps: 0, description: $t('sqlView.executingQuery') });
    try {
      const res = await api.executeQuery(fileContent);
      emits(
        'operationStatus',
        $t('sqlView.result').replace('%d', res.status).replace('%d', res.statusText),
      );
    } catch (e) {
      emits('operationStatus', e.response?.data ?? e);
    }
    progressStore.stopProgress();
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
