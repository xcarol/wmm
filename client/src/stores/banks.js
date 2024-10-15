import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { useApi } from '../plugins/api';
import { useAppStore } from './app';

const api = useApi();

export const useBanksStore = defineStore('banks', {
  state: () => ({
    bankNames: ref([]),
    requisitionId: ref(useLocalStorage('bank_requisitionId', '')),
    requisitionName: ref(useLocalStorage('bank_requisitionName', '')),
  }),
  actions: {
    async fetchBanks() {
      try {
        const { data } = await api.banksNames();
        this.bankNames = data;
      } catch (e) {
        const appStore = useAppStore();
        appStore.alertMessage = api.getErrorMessage(e);
      }
    },
  },
});

export default useBanksStore;
