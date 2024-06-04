import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useCsvFile } from '../plugins/csvfile';

export const useAppStore = defineStore('app', () => {
  const alertMessage = ref('');
  const csvfile = useCsvFile();

  return { alertMessage, csvfile };
});

export default useAppStore;
