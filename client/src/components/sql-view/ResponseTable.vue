<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th
          v-for="header in headers"
          :key="header"
        >
          {{ header }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row"
      >
        <td
          v-for="cell in row"
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

const props = defineProps({
  tableHeaders: {
    type: Array,
    default: () => [],
  },
  tableRows: {
    type: Array,
    default: () => [],
  },
});

const headers = computed(() => props.tableHeaders);
const rows = computed(() => props.tableRows);
</script>

<style scoped>
.truncate {
  max-width: 1000px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
