<template>
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
</template>

<script setup>
import { computed } from 'vue';
import { VTable } from 'vuetify/lib/components/index.mjs';
import { useAppStore } from '../../stores/app';

const props = defineProps({
  hasHeader: {
    type: Boolean,
    default: false,
  },
});

const appStore = useAppStore();

const tableRowsItems = () => {
  const items = [];
  let header = 0;

  if (props.hasHeader === true) {
    header = 1;
  }
  for (let rowCount = header; rowCount < Math.min(appStore.csvfile.rowCount, 5); rowCount += 1) {
    const row = [];
    const csvrow = appStore.csvfile.rows.at(rowCount);
    for (let cell = 0; cell < appStore.csvfile.fieldCount; cell += 1) {
      row.push(csvrow.at(cell));
    }
    items.push(row);
  }

  return items;
};

const tableHeaderItems = () => {
  const items = [];

  if (props.hasHeader === true) {
    const row = appStore.csvfile.rows.at(0);
    for (let n = 0; n < row.length; n += 1) {
      items.push(row.at(n));
    }
  } else {
    for (let n = 0; n < appStore.csvfile.fieldCount; n += 1) {
      items.push(n.toString());
    }
  }

  return items;
};

const tableHeaders = computed(() => (appStore.csvfile.rowCount === 0 ? [] : tableHeaderItems()));
const tableItems = computed(() => (appStore.csvfile.rowCount === 0 ? [] : tableRowsItems()));
</script>

<style scoped>
.truncate {
  max-width: 1000px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
