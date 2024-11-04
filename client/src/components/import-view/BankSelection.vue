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
import { computed } from 'vue';
import { VCombobox } from 'vuetify/lib/components/index.mjs';
import { useAppStore } from '../../stores/app';
import { useBanksStore } from '../../stores/banks';

const emits = defineEmits(['selectedBank']);

defineProps({
  bankName: {
    type: String,
    required: true,
  },
});

const banks = useBanksStore();
const appStore = useAppStore();

const noFileLoaded = computed(() => appStore.csvfile.rowCount === 0);
const bankNames = computed(() => banks.bankNames);

const bankSelected = (value) => {
  emits('selectedBank', value);
};
</script>
