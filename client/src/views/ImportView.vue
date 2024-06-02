<template>
  <v-container>
    <v-text-field :label="fileName" />
    <v-btn variant="outlined">
      {{ $t('importView.selectFileButton') }}
    </v-btn>
  </v-container>
  <v-container>
    <v-combobox
      :label="$t('importView.dateColumnLabel')"
      :items="dateItems"
      variant="outlined"
      readonly
    ></v-combobox>
    <v-combobox
      :label="$t('importView.descriptionColumnLabel')"
      :items="descriptionItems"
      variant="outlined"
      readonly
    ></v-combobox>
    <v-combobox
      :label="$t('importView.amountColumnLabel')"
      :items="amountItems"
      variant="outlined"
      readonly
    ></v-combobox>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const fileName = ref('');
const dateItems = ref([]);
const descriptionItems = ref([]);
const amountItems = ref([]);
</script>
