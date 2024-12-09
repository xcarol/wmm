<template>
  <v-row>
    <v-col
      sm="6"
      cols="12"
    >
      <v-card flat>
        <v-card-title>{{ $t('banksView.useBank') }}</v-card-title>
        <v-list>
          <v-list-item
            v-for="bank in registeredBanks"
            :key="bank.id"
            :prepend-avatar="bank.logo"
            :title="bank.name"
            :subtitle="subtitle(bank.date)"
          >
            <template #append>
              <v-icon
                :disabled="!outdated(bank.date)"
                :color="reconnectColor(bank.date)"
                icon="$reconnect"
                @click="reconnectBank(bank.name, bank.id)"
              />
              <v-icon
                :disabled="outdated(bank.date)"
                :color="refreshColor(bank.date)"
                icon="$refresh"
                @click="refreshBank(bank.name, bank.id)"
              />
              <v-icon
                icon="$remove"
                @click="deleteBank(bank.name, bank.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
    <v-col
      sm="6"
      cols="12"
    >
      <v-card flat>
        <v-card-title>{{ $t('banksView.configBank') }}</v-card-title>
        <v-text-field
          class="mx-4"
          :model-value="filter"
          @update:model-value="updateFilter"
        ></v-text-field>
        <v-list>
          <v-list-item
            v-for="bank in filteredBanks"
            :key="bank.id"
            :prepend-avatar="bank.logo"
            :title="bank.name"
            style="cursor: pointer"
            @click.stop="selectBank(bank.name, bank.id)"
          >
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUpdate } from 'vue';
import {
  VCard,
  VCardTitle,
  VCol,
  VIcon,
  VList,
  VListItem,
  VRow,
  VTextField,
} from 'vuetify/lib/components/index.mjs';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useBanksStore } from '../stores/banks';
import { useMessageDialogStore } from '../stores/messageDialog';
import { useProgressDialogStore } from '../stores/progressDialog';

const api = useApi();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const banksStore = useBanksStore();
const messageDialog = useMessageDialogStore();
const progressDialog = useProgressDialogStore();
const { t: $t } = useI18n();

const banks = ref([]);
const registeredBanks = ref([]);

const REDIRECT_URL = window.location.href;

const filter = ref('');

const updateFilter = (newFilter) => {
  filter.value = newFilter;
};

const filteredBanks = computed(() => {
  const regex = new RegExp(`.*${filter.value}.*`, 'i');
  return banks.value
    .filter((bank) => {
      return regex.test(bank.name);
    })
    .filter((fbank) => {
      return registeredBanks.value.length
        ? registeredBanks.value.filter((rbank) => fbank.id !== rbank.id).length > 0
        : true;
    });
});

const outdated = (date) => {
  const today = dayjs();
  const dateToCheck = dayjs(date);
  return dateToCheck <= today;
};

const reconnectColor = (date) => {
  return outdated(date) ? '' : 'grey';
};

const refreshColor = (date) => {
  return outdated(date) ? 'grey' : '';
};

const subtitle = (date) => {
  return outdated(date)
    ? $t('banksView.connectionsOutdate').replace('%s', dayjs(date).format('YYYY-MM-DD'))
    : $t('banksView.connectionsDate').replace('%s', dayjs(date).format('YYYY-MM-DD'));
};

const getInstitutions = async () => {
  banks.value = [];
  const { data: institutions } = await api.bankInstitutions();
  institutions.forEach((institution) => {
    const { id, logo, name } = institution;
    banks.value.push({ id, logo, name });
  });
};

const getRegisteredBanks = async () => {
  registeredBanks.value = [];
  const { data: dbRegisteredBanks } = await api.registeredBanks();
  dbRegisteredBanks.forEach((registeredBank) => {
    const bankData = banks.value.find((bank) => bank.id === registeredBank.institution_id);
    if (bankData) {
      const { id, logo, name } = bankData;
      registeredBanks.value.push({ id, logo, name, date: registeredBank.validity_date });
    }
  });
};

const registerBank = async (institutionName, institutionId) => {
  try {
    const { data } = await api.bankRegisterInit(institutionId, REDIRECT_URL);
    banksStore.requisitionId = data.requisition_id;
    banksStore.requisitionName = institutionName;
    window.open(data.link, '_self');
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const applyFilters = () => {
  messageDialog.showMessage({
    title: $t('dialog.Question'),
    message: $t('banksView.applyFilters'),
    no: () => {},
    yes: async () => {
      progressDialog.startProgress({
        steps: 0,
        description: $t('progress.updateProgress'),
      });
      await api.applyFilters();
      progressDialog.stopProgress();
    },
  });
};

const reconnectBank = async (institutionName, institutionId) => {
  messageDialog.showMessage({
    title: $t('dialog.Question'),
    message: $t('banksView.reconnect'),
    yes: async () => {
      await registerBank(institutionName, institutionId);
    },
    no: () => {},
  });
};

const refreshBank = async (bankName, bankId) => {
  progressDialog.startProgress({
    steps: 0,
    description: $t('progress.updateProgress'),
  });

  try {
    const {
      data: { affectedRows },
    } = await api.refreshBank(bankId);

    messageDialog.showMessage({
      title: $t('dialog.Info'),
      message: affectedRows
        ? $t('importView.importedRows').replace('%d', affectedRows)
        : $t('importView.noImportedRows'),
      ok: () => {
        if (affectedRows) {
          applyFilters();
        }
      },
    });
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  progressDialog.stopProgress();
};

const deleteBank = (bankName, bankId) => {
  messageDialog.showMessage({
    title: $t('dialog.Question'),
    message: $t('banksView.deleteBank').replace('%s', bankName),
    yes: async () => {
      try {
        await api.deleteBank(bankId);
        await getRegisteredBanks();
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }
    },
    no: () => {},
  });
};

const selectBank = async (institutionName, institutionId) => {
  messageDialog.showMessage({
    title: $t('dialog.Question'),
    message: $t('banksView.registerInit'),
    yes: async () => {
      await registerBank(institutionName, institutionId);
    },
    no: () => {},
  });
};

const parseParams = async () => {
  const { ref: nordigenRef } = route.query;

  if (nordigenRef) {
    try {
      await api.bankRegisterComplete(banksStore.requisitionName, banksStore.requisitionId);
      messageDialog.showMessage({
        title: $t('dialog.Info'),
        message: $t('banksView.registerSuccess'),
        ok: () => {
          banksStore.requisitionId = '';
          banksStore.requisitionName = '';
        },
      });
      router.push('/banks');
    } catch (e) {
      appStore.alertMessage = api.getErrorMessage(e);
    }
  }
};

onBeforeUpdate(async () => parseParams());
onBeforeMount(async () => {
  try {
    await parseParams();
    await getInstitutions();
    await getRegisteredBanks();
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
});
</script>
