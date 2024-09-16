<template>
  <v-card class="pt-5">
    <v-card-actions class="align-start ml-4 mr-4">
      <v-text-field
        v-model="selectedDate"
        append-inner-icon="$calendar"
        :label="$t('addTransactionView.dateLabel')"
        @click:append-inner="showDateCalendar"
      />
      <v-select
        v-model="selectedBankName"
        class="ml-4"
        :items="banksNames"
        :rules="[validationRules.required]"
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
        :rules="[validationRules.required, validationRules.number]"
        :label="$t('addTransactionView.amountLabel')"
      >
        <template #prepend-inner>
          <v-icon
            :color="amountColor"
            @click.stop="switchSign"
            >{{ amountSign }}</v-icon
          >
        </template>
      </v-text-field>
    </v-card-actions>
    <v-card-actions class="align-start ml-4 mr-4">
      <v-combobox
        v-model="transactionDescription"
        :items="descriptions"
        :rules="[validationRules.required]"
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
  <calendar-dialog
    v-model="dateCalendarVisible"
    @date-selected="onDateSelected"
  />
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
import CalendarDialog from '../components/CalendarDialog.vue';

dayjs.extend(customParseFormat);

const DATE_FORMAT = 'YYYY-MM-DD';
const BANK_LENGTH = 200;
const DESCRIPTION_LENGTH = 200;

const minusIcon = '$minus';
const minusColor = 'red';
const plusIcon = '$plus';
const plusColor = 'green';
const banksNames = ref([]);
const categoriesNames = ref([]);
const selectedDate = ref(dayjs().format(DATE_FORMAT));
const selectedBankName = ref('');
const selectedCategory = ref('');
const transactionDescription = ref('');
const transactionAmount = ref('');
const dateCalendarVisible = ref(false);
const amountSign = ref(minusIcon);
const amountColor = ref(minusColor);
let amountOperator = -1;

const api = useApi();
const appStore = useAppStore();
const progressDialog = useProgressDialogStore();
const messageDialog = useMessageDialogStore();
const { t: $t } = useI18n();

const validationRules = {
  required: (value) => !!value || $t('validation.required'),
  number: (value) => {
    const pattern = /^[0-9|,|.]+$/;
    return pattern.test(value) || $t('validation.number');
  },
};

const showDateCalendar = () => {
  dateCalendarVisible.value = true;
};

const switchSign = () => {
  if (amountSign.value === minusIcon) {
    amountSign.value = plusIcon;
    amountColor.value = plusColor;
    amountOperator = 1;
  } else {
    amountSign.value = minusIcon;
    amountColor.value = minusColor;
    amountOperator = -1;
  }
};

const onDateSelected = (date) => {
  dateCalendarVisible.value = false;
  selectedDate.value = dayjs(date).format(DATE_FORMAT);
};

const descriptions = computed(() => appStore.addTransactionHistory);

const notReadyToAdd = () => {
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

// TODO: move this logic to the server
const csvAmountToSql = (amount) => {
  let csvAmount = amount;
  const comma = ',';
  const point = '.';
  const commaSeparator = amount.split(comma);
  const pointSeparator = amount.split(point);

  if (commaSeparator.length > 1) {
    const pointIsDecimal = commaSeparator.at(commaSeparator.length - 1).split(point).length > 1;
    const commaIsDecimal = pointSeparator.at(pointSeparator.length - 1).split(comma).length > 1;

    if (pointIsDecimal) {
      csvAmount = amount.replaceAll(',', '');
    } else if (commaIsDecimal) {
      csvAmount = amount.replaceAll('.', '').replaceAll(',', '.');
    }
  }

  if (pointSeparator.length > 1) {
    const commaIsDecimal = pointSeparator.at(pointSeparator.length - 1).split(comma).length > 1;

    if (commaIsDecimal) {
      csvAmount = amount.replaceAll('.', '').replaceAll(',', '.');
    }
  }

  return parseFloat(csvAmount);
};

const addTransaction = async () => {
  const date = selectedDate.value;
  const bank = selectedBankName.value;
  const category = selectedCategory.value;
  const amount = csvAmountToSql(transactionAmount.value) * amountOperator;
  const description = transactionDescription.value;

  appStore.addDescriptionToAddTransactionHistory(description);

  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.retrievingCategories'),
  });

  let res = 0;
  try {
    res = await api.addTransaction(
      date,
      bank.slice(0, BANK_LENGTH),
      category,
      description.slice(0, DESCRIPTION_LENGTH),
      amount,
    );
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  } finally {
    progressDialog.stopProgress();
  }

  if (res) {
    messageDialog.showMessage({
      title: $t('dialog.Info'),
      message: $t('addTransactionView.success'),
      ok: () => {},
    });
  }
};

const beforeMount = async () => {
  await getBanksAndCategories();
};

onBeforeMount(() => beforeMount());
</script>
