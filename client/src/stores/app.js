import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useCsvFile } from '../plugins/csvfile';

export const useAppStore = defineStore('app', {
  state: () => ({
    alertMessage: ref(''),
    csvfile: useCsvFile(),
    progress: {
      description: '',
      active: false,
      step: 0,
      maxSteps: 0,
      cancelled: 0,
    },
  }),
  getters: {
    progressIsActive: (state) => state.progress.active,
    progressIsCancelled: (state) => state.progress.cancelled,
  },
  actions: {
    startProgress(payload) {
      this.progress.active = true;
      this.progress.cancelled = false;
      this.progress.maxSteps = payload.steps;
      this.progress.description = payload.description;
    },
    updateProgress(payload) {
      this.progress.step = payload.step;
      this.progress.description = payload.description;
    },
    cancelProgress() {
      this.progress.active = false;
      this.progress.cancelled = true;
    },
    stopProgress() {
      this.progress.active = false;
      this.progress.cancelled = false;
    },
  },
});

export default useAppStore;
