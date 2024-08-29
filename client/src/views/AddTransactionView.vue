<template>
  <v-card>
    <v-card-actions class="align-start ml-4 mr-4">
      <v-text-field
        v-model="selectedDate"
        append-inner-icon="$calendar"
        :label="$t('addTransactionView.dateLabel')"
        readonly
        @click:append-inner="showDateCalendar"
      />
      <v-select
        v-model="selectedBankName"
        class="ml-4"
        :items="banksNames"
        :label="$t('addTransactionView.bankNameLabel')"
      />
      <v-select
        v-model="selectedCategory"
        class="ml-4"
        :items="categoriesNames"
        :label="$t('addTransactionView.categoryLabel')"
      />
      <v-text-field
        v-model="transactionAmount"
        class="ml-4"
        :label="$t('addTransactionView.amountLabel')"
      />
    </v-card-actions>
    <v-card-actions class="align-start ml-4 mr-4">
      <v-combobox
        v-model="transactionDescription"
        :items="descriptions"
        :label="$t('addTransactionView.descriptionLabel')"
        clearable
      />
      <v-btn
        class="ml-4"
        :disabled="notReadyToAdd()"
        @click.stop="addTransaction"
      >
        {{ $t('addTransactionView.addButton') }}
      </v-btn>
    </v-card-actions>
  </v-card>
  <v-dialog v-model="dateCalendarVisible">
    <v-calendar
      :attributes="dateCalendarAttributes"
      is-dark="system"
      @dayclick="onDateSelected"
    />
  </v-dialog>
</template>

<script setup>
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ref, onBeforeMount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useProgressDialogStore } from '../stores/progressDialog';
import { useMessageDialogStore } from '../stores/messageDialog';

dayjs.extend(customParseFormat);

const banksNames = ref([]);
const categoriesNames = ref([]);
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const selectedBankName = ref('');
const selectedCategory = ref('');
const transactionDescription = ref('');
const transactionAmount = ref('');
const dateCalendarVisible = ref(false);

const api = useApi();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();
const messageDialog = useMessageDialogStore();
const { t: $t } = useI18n();

const showDateCalendar = () => {
  dateCalendarVisible.value = true;
};

const onDateSelected = (date) => {
  const dateFormatted = `${date.year}-${date.month}-${date.day}`;

  dateCalendarVisible.value = false;
  selectedDate.value = dateFormatted;
};

const dateCalendarAttributes = computed(() => [{ highlight: true, dates: selectedDate.value }]);
const descriptions = computed(() => appStore.addTransactionHistory);

const notReadyToAdd = () => {
  console.log(`${transactionAmount.value} is ${parseFloat(transactionAmount.value)}`);
  return (
    selectedDate.value === '' ||
    transactionDescription.value === '' ||
    selectedBankName.value === '' ||
    Number.isNaN(parseFloat(transactionAmount.value))
  );
};

const getBanksAndCategories = async () => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  try {
    const { data: categories } = await api.categoriesNames();
    const { data: banks } = await api.banksNames();

    categoriesNames.value = [''].concat(categories);
    banksNames.value = banks;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const addTransaction = async () => {
  const date = selectedDate.value;
  const bank = selectedBankName.value;
  const category = selectedCategory.value;
  const amount = transactionAmount.value;
  const description = transactionDescription.value;

  appStore.addDescriptionToAddTransactionHistory(description);

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  try {
    await api.addTransaction(date, bank, category, description, amount);
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();

  messageDialog.showMessage({
    title: $t('dialog.Info'),
    message: $t('addTransactionView.success'),
    ok: () => {},
  });
};

const beforeMount = async () => {
  await getBanksAndCategories();
};

onBeforeMount(() => beforeMount());
</script>
