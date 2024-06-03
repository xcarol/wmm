<template>
  <v-container>
    <v-file-input
      :label="fileName"
      accept="text/csv"
      variant="outlined"
      @change="handleFileChange"
    />
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

const fileName = ref($t('importView.importFileInputLabel'));
const dateItems = ref([]);
const descriptionItems = ref([]);
const amountItems = ref([]);

const readFileContent = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const fileContent = event.target.result;
    // Processa el contingut del fitxer
    console.log(fileContent);
  };
  reader.readAsText(file);
};

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    readFileContent(selectedFile);
  }
};

</script>
