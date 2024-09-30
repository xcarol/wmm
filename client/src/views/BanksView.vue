<template>
  <v-card>
    <v-card-title>BANKS</v-card-title>
  </v-card>
</template>

<script setup>
import { onBeforeMount, onBeforeUpdate } from 'vue';
import { useApi } from '../plugins/api';

const api = useApi();

onBeforeUpdate();
onBeforeMount(async () => {
  await api.bankInstitutions();
});
</script>