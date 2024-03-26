<template>
  <v-card>
    <v-card-title>
      {{ $t('import_csv.title') }}
    </v-card-title>
    <v-card-actions>
      <v-file-input
        :label="$t('import_csv.label')"
        :model-value="importFilename"
      >
      </v-file-input>
    </v-card-actions>
    <v-card-actions>
      <v-btn>{{ $t('import_csv.button') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const importFilename = [];
const { t: $t } = useI18n();
</script>
