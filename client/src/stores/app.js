import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useCsvFile } from '../plugins/csvfile';

export const useAppStore = defineStore('app', {
  state: () => ({
    categorySearchHistory: ref([]),
    alertMessage: ref(''),
    csvfile: useCsvFile(),
  }),
  actions: {
    addSearchToCategoryHistory(search) {
      if(this.categorySearchHistory.includes(search) === false) {
        this.categorySearchHistory.push(search);
      }
    },
  },
});

export default useAppStore;
