import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const alertMessage = ref('');

  return { alertMessage };
});

export default useAppStore;
