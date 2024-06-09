<template>
  <v-card class="text-end">
    <v-card-text>
      <v-textarea
        v-model="sqlQueryText"
        :label="$t('sqlView.queryAreaLabel')"
      />
    </v-card-text>
    <v-card-actions>
      <backup-response
        @operation-status="backupResponseStatus"
      />
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
      <response-table
        :table-headers="tableHeaders"
        :table-rows="tableItems"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import ResponseTable from '../components/sql-view/ResponseTable.vue';
import BackupResponse from '../components/sql-view/BackupRestore.vue';

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

const backupResponseStatus = (status) => {
  tableHeaders.value = [];
  tableItems.value = [];
  sqlQueryResponse.value = status;
};

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
</script>
