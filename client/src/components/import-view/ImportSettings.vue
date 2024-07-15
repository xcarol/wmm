<template>
  <v-card>
    <v-card-text>
      <v-col>
        <v-row>
          <v-checkbox
            v-model="headerStatus"
            :label="$t('importView.firstRowIsAHeader')"
            :disabled="noFileLoaded"
            @update:model-value="notifyCheckState"
          />
        </v-row>
        <v-row>
          <v-select
            v-model="selectedDateColumn"
            :label="$t('importView.dateColumnLabel')"
            :items="dateItems"
            :disabled="noFileLoaded"
            @update:model-value="notifyDateColumnSelected"
          />
        </v-row>
        <v-row>
          <v-select
            v-model="selectedDescriptionColumn"
            :label="$t('importView.descriptionColumnLabel')"
            :items="descriptionItems"
            :disabled="noFileLoaded"
            @update:model-value="notifyDescriptionColumnSelected"
          />
        </v-row>
        <v-row>
          <v-select
            v-model="selectedAmountColumn"
            :label="$t('importView.amountColumnLabel')"
            :items="amountItems"
            :disabled="noFileLoaded"
            @update:model-value="notifyAmountColumnSelected"
          />
        </v-row>
      </v-col>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/app';

const props = defineProps({
  hasHeader: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits([
  'checkStateChanged',
  'selectedDateColumn',
  'selectedDescriptionColumn',
  'selectedAmountColumn',
]);

const appStore = useAppStore();

const selectedDateColumn = ref('');
const selectedDescriptionColumn = ref('');
const selectedAmountColumn = ref('');

const columnItems = () => {
  const items = [''];

  if (props.hasHeader === true) {
    const row = appStore.csvfile.rows.at(0);
    for (let n = 0; n < row.length; n += 1) {
      items.push(row.at(n));
    }
  } else {
    for (let n = 0; n < appStore.csvfile.fieldCount; n += 1) {
      items.push(n.toString());
    }
  }

  return items;
};

const dateColumnItems = () => {
  selectedDateColumn.value = '';
  return columnItems();
};

const descriptionColumnItems = () => {
  selectedDescriptionColumn.value = '';
  return columnItems();
};

const amountColumnItems = () => {
  selectedAmountColumn.value = '';
  return columnItems();
};

const headerStatus = ref(props.hasHeader);
const noFileLoaded = computed(() => appStore.csvfile.rowCount === 0);
const dateItems = computed(() => (appStore.csvfile.rowCount === 0 ? [] : dateColumnItems()));
const descriptionItems = computed(() =>
  appStore.csvfile.rowCount === 0 ? [] : descriptionColumnItems(),
);
const amountItems = computed(() => (appStore.csvfile.rowCount === 0 ? [] : amountColumnItems()));

const notifyCheckState = (value) => {
  emits('checkStateChanged', value);
};

const notifyDateColumnSelected = (value) => {
  emits('selectedDateColumn', dateItems.value.indexOf(value) - 1);
};

const notifyDescriptionColumnSelected = (value) => {
  emits('selectedDescriptionColumn', descriptionItems.value.indexOf(value) - 1);
};

const notifyAmountColumnSelected = (value) => {
  emits('selectedAmountColumn', amountItems.value.indexOf(value) - 1);
};
</script>
