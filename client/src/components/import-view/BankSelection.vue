<template>
  <v-container>
    <v-combobox
      v-model="selectedBankName"
      :label="$t('importView.bankLabel')"
      :items="bankNames"
      :disabled="noFileLoaded"
      variant="outlined"
      @update:model-value="bankSelected"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { useApi } from '../../plugins/api';
import { useAppStore } from '../../stores/app';

const emits = defineEmits([
  'selectedBank',
]);

const api = useApi();
const appStore = useAppStore();

const selectedBankName = ref('');
const bankNames = ref([]);

const noFileLoaded = computed(() => appStore.csvfile.rowCount === 0);

const bankSelected = (value) => {
  emits('selectedBank', value);
};

const getBankNames = async () => {
  const dbNames = await api.bankNames();
  bankNames.value = dbNames.data;
};

onBeforeMount(() => getBankNames());
</script>