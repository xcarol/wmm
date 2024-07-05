<template>
  <v-card>
    <v-card-text>
      <v-select
            v-model="selectedYear"
            :label="$t('browseCategoriesView.yearLabel')"
            :items="yearItems"
            @update:model-value="updateYearSelected"
          />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import { useApi } from '../plugins/api';

const api = useApi();

const yearItems = ref([]);
const selectedYear = ref('');

const updateYears = async () => {
  const result = await api.getYears();
  yearItems.value = result.data;
};

onBeforeMount(() => updateYears());
</script>