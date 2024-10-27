import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { useCsvFile } from '../plugins/csvfile';

export const useAppStore = defineStore('app', {
  state: () => ({
    showViewDrawer: ref(false),
    categorySearchHistory: useLocalStorage('app_categorySearchHistory', []),
    addTransactionHistory: useLocalStorage('app_addTransactionHistory', []),
    sqlHistory: useLocalStorage('app_sqlHistory', []),
    alertMessage: ref(''),
    csvfile: useCsvFile(),
    viewHeight: ref(0),
  }),
  actions: {
    addSearchToCategoryHistory(search) {
      if (search && search.length && this.categorySearchHistory.includes(search) === false) {
        this.categorySearchHistory.unshift(search);
      }
    },
    addDescriptionToAddTransactionHistory(description) {
      if (
        description &&
        description.length &&
        this.addTransactionHistory.includes(description) === false
      ) {
        this.addTransactionHistory.unshift(description);
      }
    },
    addQueryToSqlHistory(query) {
      const idx = this.sqlHistory.indexOf(query);

      if (idx >= 0) {
        this.sqlHistory.splice(idx, 1);
      }

      if (query.length) {
        this.sqlHistory.push(query);
      }
    },
    nextQueryInHistory(query) {
      if (query.length === 0) {
        return this.sqlHistory.at(0);
      }
      const idx = this.sqlHistory.indexOf(query);

      if (idx >= 0 && idx < this.sqlHistory.length - 1) {
        return this.sqlHistory.at(idx + 1);
      }

      return null;
    },
    previousQueryInHistory(query) {
      if (query.length === 0) {
        return this.sqlHistory.at(this.sqlHistory.length - 1);
      }
      const idx = this.sqlHistory.indexOf(query);

      if (idx > 0) {
        return this.sqlHistory.at(idx - 1);
      }

      return null;
    },
  },
});

export default useAppStore;
