import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useApi } from '../plugins/api';
import { useAppStore } from './app';

const api = useApi();

export const banksStore = defineStore('banks', {
  state: () => ({
    bankNames: ref([]),
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

export default banksStore;
