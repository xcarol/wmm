<template>
  <v-card>
    <v-card-title>
      {{ $t('import_csv.title') }}
    </v-card-title>
    <v-card-text>
      {{ selectedFilename }}
    </v-card-text>
    <v-card-actions>
      <v-btn>{{ $t('import_csv.import_button') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const importFilename = '';
const { t: $t } = useI18n();
const selectedFilename = importFilename.length ? importFilename : $t('import_csv.no_file_selected');
</script>
