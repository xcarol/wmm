import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useCsvFile } from '../plugins/csvfile';

export const useAppStore = defineStore('app', {
  state: () => ({
    categorySearchHistory: ref([]),
    sqlHistory: ref([]),
    alertMessage: ref(''),
    csvfile: useCsvFile(),
  }),
  actions: {
    addSearchToCategoryHistory(search) {
      if(search.length && this.categorySearchHistory.includes(search) === false) {
        this.categorySearchHistory.push(search);
      }
    },
    addQueryToSqlHistory(query) {
      if(query.length && this.sqlHistory.includes(query) === false) {
        this.sqlHistory.push(query);
      }
    },
    nextQueryInHistory(query) {
      const idx = this.sqlHistory.indexOf(query);
      
      if (idx >= 0 && idx < this.sqlHistory.length - 1) {
        return this.sqlHistory.at(idx + 1);
      }

      return null;
    },
    previousQueryInHistory(query) {
      const idx = this.sqlHistory.indexOf(query);
      
      if (idx > 0) {
        return this.sqlHistory.at(idx - 1);
      }

      return null;
    },
  },
});

export default useAppStore;
