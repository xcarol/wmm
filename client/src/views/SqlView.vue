<template>
  <v-card class="text-end">
    <v-card-text>
      <v-textarea
        v-model="sqlQueryText"
        :label="$t('sqlView.queryAreaLabel')"
      />
    </v-card-text>
    <v-card-actions>
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
      <v-spacer />
      <v-btn
        variant="tonal"
        @click.stop="executeQuery"
        >{{ $t('sqlView.queryButton') }}</v-btn
      >
    </v-card-actions>
  </v-card>
  <v-card v-show="sqlQueryResponse">
    <v-card-text>
      <v-textarea
        v-model="sqlQueryResponse"
        readonly
        :rows="responseHeight"
      />
    </v-card-text>
    <v-card-text>
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
    </v-card-text>
    <input
      id="fileInput"
      type="file"
      hidden
      @change="handleFileChange"
    />
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';

const { t: $t } = useI18n();
const appStore = useAppStore();
const api = useApi();

const sqlQueryText = ref('');
const sqlQueryResponse = ref('');
const tableHeaders = ref([]);
const tableItems = ref([]);
const responseHeight = computed(() =>
  sqlQueryResponse.value.split('\n').length > 1 ? sqlQueryResponse.value.split('\n').length + 1 : 1,
);

const resetView = () => {
  sqlQueryResponse.value = '';
  tableHeaders.value = [];
  tableItems.value = [];
};

const executeQuery = async () => {
  resetView();

  appStore.startProgress({ steps: 0, description: $t('sqlView.executingQuery') });
  try {
    const res = await api.executeQuery(sqlQueryText.value);
    const rows = res.data[0];
    const headers = res.data[1];
    if (headers) {
      headers.forEach((header) => {
        if (header) {
          const label = header.name.toUpperCase();
          tableHeaders.value.push(label);
        }
      });
      rows.forEach((row) => {
        const tablerow = [];
        headers.forEach((header) => {
          if (header) {
            tablerow.push(row[header.name]);
          }
        });
        if (tablerow.length) {
          tableItems.value.push(tablerow);
        }
      });
      sqlQueryResponse.value = $t('sqlView.result')
        .replace('%d', res.status)
        .replace('%d', res.statusText);
    } else {
      sqlQueryResponse.value = $t('sqlView.affectedRows')
        .replace('%d', rows.affectedRows)
        .replace('%d', rows.changedRows);
    }
  } catch (e) {
    sqlQueryResponse.value = e.response?.data ?? e;
  }
  appStore.stopProgress();
};

const executeBackup = async () => {
  resetView();
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
  } catch (e) {
    sqlQueryResponse.value = e.response?.data ?? e;
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
      sqlQueryResponse.value = $t('sqlView.result')
        .replace('%d', res.status)
        .replace('%d', res.statusText);
    } catch (e) {
      sqlQueryResponse.value = e.response?.data ?? e;
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
