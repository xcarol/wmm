<template>
  <v-row
    class="flex-grow-1 d-flex flex-column my-box"
  >
    <v-col
      cols="6"
      class="flex-grow-1 d-flex flex-column my-box"
    >
      <v-card
        class="flex-grow-1 d-flex flex-column mybox"
      >
        <v-card-title>Select bank to configure</v-card-title>
        <v-text-field
          class="pl-4"
          :model-value="filter"
          @update:model-value="updateFilter"
        ></v-text-field>
        <v-list
          class="flex-grow-1"
          style="overflow-y: auto; height: 100%; margin: 0; padding: 0; box-sizing: border-box"
        >
          <v-list-item
            v-for="bank in filteredBanks"
            :key="bank.id"
            :prepend-avatar="bank.logo"
            :title="bank.name"
            style="cursor: pointer"
            @click.stop="selectBank"
          >
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, onBeforeMount, onBeforeUpdate } from 'vue';
import { useApi } from '../plugins/api';

const api = useApi();
const banks = ref([]);

const filter = ref('');

const updateFilter = (newFilter) => {
  filter.value = newFilter;
};

const filteredBanks = computed(() => {
  const regex = new RegExp(`.*${filter.value}.*`, 'i');
  return banks.value.filter((bank) => {
    return regex.test(bank.name);
  });
});

const selectBank = () => {};

onBeforeUpdate();
onBeforeMount(async () => {
  const { data: institutions } = await api.bankInstitutions();
  institutions.forEach((institution) => {
    const { id, logo, name } = institution;
    banks.value.push({ id, logo, name });
  });
});
</script>

<style scoped>
.my-box {
  height: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
