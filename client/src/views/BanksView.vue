<template>
  <v-row class="flex-grow-1 d-flex flex-column my-box">
    <v-col
      cols="6"
      class="flex-grow-1 d-flex flex-column my-box"
    >
      <v-card class="flex-grow-1 d-flex flex-column mybox">
        <v-card-title>{{ $t('banksView.configBank') }}</v-card-title>
        <v-text-field
          class="pl-4"
          :model-value="filter"
          @update:model-value="updateFilter"
        ></v-text-field>
        <v-list
          class="flex-grow-1"
          style="overflow-y: auto; height: 100%; margin: 0; padding: 0; box-sizing: border-box"
        >
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
    <v-col
      cols="6"
      class="flex-grow-1 d-flex flex-column my-box"
    >
      <v-card class="flex-grow-1 d-flex flex-column mybox">
        <v-card-title>{{ $t('banksView.useBank') }}</v-card-title>
        <v-list
          class="flex-grow-1"
          style="overflow-y: auto; height: 100%; margin: 0; padding: 0; box-sizing: border-box"
        >
          <v-list-item
            v-for="bank in registeredBanks"
            :key="bank.id"
            :prepend-avatar="bank.logo"
            :title="bank.name"
          >
            <template #append>
              <v-icon
                icon="$refresh"
                @click="refreshBank(bank.name, bank.id)"
              >
              </v-icon>
              <v-icon
                icon="$remove"
                @click="deleteBank(bank.name, bank.id)"
              >
              </v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUpdate } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
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
      registeredBanks.value.push({ id, logo, name });
    }
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
      message: $t('importView.importedRows').replace('%d', affectedRows),
      ok: () => {},
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
      try {
        const { data } = await api.bankRegisterInit(institutionId, REDIRECT_URL);
        banksStore.requisitionId = data.requisition_id;
        banksStore.requisitionName = institutionName;
        window.open(data.link, '_self');
      } catch (e) {
        appStore.alertMessage = api.getErrorMessage(e);
      }
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

<style scoped>
.my-box {
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
