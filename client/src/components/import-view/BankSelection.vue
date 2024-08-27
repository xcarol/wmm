<template>
  <v-combobox
    :model-value="bankName"
    :label="$t('importView.bankLabel')"
    :items="bankNames"
    :disabled="noFileLoaded"
    @update:model-value="bankSelected"
  />
</template>

<script setup>
import { computed, onBeforeUpdate, onBeforeMount } from 'vue';
import { useAppStore } from '../../stores/app';
import { banksStore } from '../../stores/banks';

const emits = defineEmits(['selectedBank']);

defineProps({
  bankName: {
    type: String,
    required: true,
  },
});

const banks = banksStore();
const appStore = useAppStore();

const noFileLoaded = computed(() => appStore.csvfile.rowCount === 0);
const bankNames = computed(() => banks.bankNames);

const bankSelected = (value) => {
  emits('selectedBank', value);
};

onBeforeUpdate(() => banks.fetchBanks());
onBeforeMount(() => banks.fetchBanks());
</script>
