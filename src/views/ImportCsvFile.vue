<template>
  <v-card>
    <v-card-title>
      {{ $t('import_csv.title') }}
    </v-card-title>
    <v-card-actions>
      <v-file-input
        v-model="importFilename"
        :label="$t('import_csv.label')"
      >
      </v-file-input>
    </v-card-actions>
    <v-card-actions>
      <v-btn @click.stop="openSelectedFile">{{ $t('import_csv.open_button') }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const importFilename = ref([]);
const { t: $t } = useI18n();

const openSelectedFile = () => {
  const files = importFilename.value;
  if (files.length) {
    const reader = new FileReader();

    reader.readAsText(this.chosenFile);
    reader.onload = () => {
      this.data = reader.result;
    };
  }
};
</script>
