<template>
  <file-input />
  <file-preview :has-header="firstRowIsAHeader" />
  <column-selection
    :has-header="firstRowIsAHeader"
    @check-state-changed="updateFirstRowState"
    @selected-date-column="updateSelectedDateColumn"
    @selected-description-column="updateSelectedDescriptionColumn"
    @selected-amount-column="updateSelectedAmountColumn"
  />
  <bank-selection @selected-bank="selectedBank" />
  <v-container>
    <v-btn
      class="align-button-right"
      :disabled="formNotFilled"
      >{{ $t('importView.importButtonLabel') }}</v-btn
    >
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';
import FileInput from '../components/import-view/FileInput.vue';
import FilePreview from '../components/import-view/FilePreview.vue';
import ColumnSelection from '../components/import-view/ColumnSelection.vue';
import BankSelection from '../components/import-view/BankSelection.vue';

const { t: $t } = useI18n();
const appStore = useAppStore();

const firstRowIsAHeader = ref(false);
const selectedDateColumn = ref('');
const selectedDescriptionColumn = ref('');
const selectedAmountColumn = ref('');
const selectedBankName = ref('');

const rowsToParse = computed(() => appStore.csvfile.rowCount);
const formNotFilled = computed(() =>
  rowsToParse.value === 0
    ? false
    : selectedDateColumn.value.length === 0 ||
      selectedDescriptionColumn.value.length === 0 ||
      selectedAmountColumn.value.length === 0 ||
      selectedBankName.value.length === 0,
);

const updateFirstRowState = (value) => {
  firstRowIsAHeader.value = value;
};

const updateSelectedDateColumn = (value) => {
  selectedDateColumn.value = value;
};

const updateSelectedDescriptionColumn = (value) => {
  selectedDescriptionColumn.value = value;
};

const updateSelectedAmountColumn = (value) => {
  selectedAmountColumn.value = value;
};

const selectedBank = (value) => {
  selectedBankName.value = value;
};
</script>

<style scoped>
.align-button-right {
  float: right;
}
</style>
