<template>
  <v-row class="flex-grow-1 d-flex flex-column my-box">
    <v-col
      cols="6"
      class="flex-grow-1 d-flex flex-column my-box"
    >
      <v-card class="flex-grow-1 d-flex flex-column mybox">
        <v-card-title>Select bank to configure</v-card-title>
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
            @click.stop="selectBank(bank.id)"
          >
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUpdate } from 'vue';
import { useRoute } from 'vue-router';
import { useApi } from '../plugins/api';
import { useAppStore } from '../stores/app';
import { useBanksStore } from '../stores/banks';

const api = useApi();
const appStore = useAppStore();
const route = useRoute();
const banksStore = useBanksStore();
const banks = ref([]);

const REDIRECT_URL = window.location.href;

const filter = ref('');

const updateFilter = (newFilter) => {
  filter.value = newFilter;
};

const filteredBanks = computed(() => {
  const regex = new RegExp(`.*${filter.value}.*`, 'i');
  return banks.value.filter((bank) => {
    return regex.test(bank.name);
  });
});

const selectBank = async (institutionId) => {
  try {
    const { data } = await api.bankRegisterInit(institutionId, REDIRECT_URL);
    banksStore.requisitionId = data.requisitionId;
    window.open(data.link, "_self");
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }
};

const parseParams = async () => {
  const { ref: nordigenRef } = route.query;

  if (nordigenRef) {
    const result = await api.bankRegisterComplete(banksStore.requisitionId);
    console.log(result);
  }
};

onBeforeUpdate(async () => parseParams());
onBeforeMount(async () => {
  console.log(banksStore.requisitionId);
    try {
    const { data: institutions } = await api.bankInstitutions();
    institutions.forEach((institution) => {
      const { id, logo, name } = institution;
      banks.value.push({ id, logo, name });
    });
    await parseParams();
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
