<template>
  <v-card>
    <v-card-text>
      <v-combobox
        :model-value="bankName"
        :label="$t('importView.bankLabel')"
        :items="bankNames"
        :disabled="noFileLoaded"
        @update:model-value="bankSelected"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { useApi } from '../../plugins/api';
import { useAppStore } from '../../stores/app';

const emits = defineEmits(['selectedBank']);

defineProps({
  bankName: {
    type: String,
    required: true,
  },
});

const api = useApi();
const appStore = useAppStore();

const bankNames = ref([]);

const noFileLoaded = computed(() => appStore.csvfile.rowCount === 0);

const bankSelected = (value) => {
  emits('selectedBank', value);
};

const getBankNames = async () => {
  try {
    const dbNames = await api.banksNames();
    bankNames.value = dbNames.data;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

onBeforeMount(() => getBankNames());
</script>
