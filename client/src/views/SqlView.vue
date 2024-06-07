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
      disabled
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
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';

const { t: $t } = useI18n();
const api = useApi();

const sqlQueryText = ref('');
const sqlQueryResponse = ref('');
const tableHeaders = ref([]);
const tableItems = ref([]);

const executeQuery = async () => {
  sqlQueryResponse.value = '';
  tableHeaders.value = [];
  tableItems.value = [];

  try {
    // TODO: give feedback for long time execute queries
    const res = await api.executeQuery(sqlQueryText.value);
    const rows = res.data[0];
    const headers = res.data[1];
    if (headers) {
      headers.forEach((header) => {
        tableHeaders.value.push(header.name);
      });
      rows.forEach((row) => {
        const tablerow = [];
        tableHeaders.value.forEach((header) => {
          tablerow.push(row[header]);
        });
        tableItems.value.push(tablerow);
      });
    } else {
      sqlQueryResponse.value = $t('sqlView.affectedRows')
        .replace('%d', rows.affectedRows)
        .replace('%d', rows.changedRows);
    }
  } catch (e) {
    sqlQueryResponse.value = e.response?.data ?? e;
  }
};
</script>
