import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useMessageStore = defineStore('messageDialog', {
  state: () => ({
    show: ref(false),
    title: ref(''),
    message: ref(''),
    yes: ref(null),
    no: ref(null),
    ok: ref(null),
    cancel: ref(null),
  }),
  getters: {
  },
  actions: {
    showMessage(payload) {
      this.show = true;
      this.title = payload.title;
      this.message = payload.message;
      this.yes = payload.yes;
      this.no = payload.no;
      this.ok = payload.ok;
      this.cancel = payload.cancel;
    },
    hideMessage() {
      this.show = false;
    },
  },
});

export default useMessageStore;
