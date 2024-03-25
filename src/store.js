import { ref } from 'vue';
import { defineStore } from 'pinia';

const store = defineStore('app', () => {
  const count = ref(0);
  const name = ref('Eduardo');
  // const doubleCount = computed(() => count.value * 2);
  // function increment() {
  //   count.value++;
  // }

  // return { count, name, doubleCount, increment };
  return { count, name };
});

export default store;