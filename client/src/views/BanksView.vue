<template>
  <v-card>
    <v-card-title>BANKS</v-card-title>
    <v-card-text>
      <v-list>
        <v-input>Folders</v-input>

        <v-list-item
          v-for="bank in banks"
          :key="bank.id"
          :prepend-avatar="bank.logo"
          :title="bank.name"
        >
        </v-list-item>

      </v-list>
    </v-card-text>
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
