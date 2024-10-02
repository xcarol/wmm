<template>
  <v-card
    class="flex-grow-1 d-flex flex-column"
    style="height: 100%; margin: 0; padding: 0; box-sizing: border-box"
  >
    <v-list
      class="flex-grow-1"
      style="overflow-y: auto; height: 100%; margin: 0; padding: 0; box-sizing: border-box"
    >
      <v-input>Folders</v-input>

      <v-list-item
        v-for="bank in banks"
        :key="bank.id"
        :prepend-avatar="bank.logo"
        :title="bank.name"
      >
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
import { ref, onBeforeMount, onBeforeUpdate } from 'vue';
import { useApi } from '../plugins/api';

const api = useApi();
const banks = ref([]);

onBeforeUpdate();
onBeforeMount(async () => {
  const { data: institutions } = await api.bankInstitutions();
  institutions.forEach((institution) => {
    const { id, logo, name } = institution;
    banks.value.push({ id, logo, name });
  });
});
</script>
