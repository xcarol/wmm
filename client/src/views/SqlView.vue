<template>
  <v-container class="text-end">
    <v-textarea
      v-model="sqlQueryText"
      :label="$t('sqlView.queryAreaLabel')"
    />
    <v-btn @click.stop="executeQuery">{{ $t('sqlView.queryButton') }}</v-btn>
  </v-container>
  <v-container v-show="sqlQueryResponse">
    <v-textarea
      v-model="sqlQueryResponse"
      readonly
      :rows="responseHeight"
    />
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

const executeQuery = async () => {
  sqlQueryResponse.value = '';
  tableHeaders.value = [];
  tableItems.value = [];

  try {
    appStore.startProgress({steps:0, description: $t("sqlView.executingQuery")});
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
</script>
