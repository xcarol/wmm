<template>
  <v-card>
    <v-card-text>
      <v-col>
        <v-row>
          <v-checkbox
            :model-value="hasHeader"
            :label="$t('importView.firstRowIsAHeader')"
            :disabled="noFileLoaded"
            @update:model-value="notifyCheckState"
          />
          <v-spacer />
          <v-text-field
            :value="initialAmount"
            :label="$t('importView.initialAmountLabel')"
            :disabled="noFileLoaded"
            @update:model-value="notifyInitialAmount"
          ></v-text-field>
        </v-row>
        <v-row>
          <v-select
            :model-value="dateColumn"
            :label="$t('importView.dateColumnLabel')"
            :items="dateItems"
            :disabled="noFileLoaded"
            @update:model-value="notifyDateColumnSelected"
          />
        </v-row>
        <v-row>
          <v-select
            :model-value="descriptionColumn"
            :label="$t('importView.descriptionColumnLabel')"
            :items="descriptionItems"
            :disabled="noFileLoaded"
            @update:model-value="notifyDescriptionColumnSelected"
          />
        </v-row>
        <v-row>
          <v-select
            :model-value="amountColumn"
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
import { computed } from 'vue';
import { useAppStore } from '../../stores/app';

const props = defineProps({
  hasHeader: {
    type: Boolean,
    default: false,
  },
  initialAmount: {
    type: Number,
    default: 0.0,
  },
  dateColumn: {
    type: String,
    required: true,
  },
  descriptionColumn: {
    type: String,
    required: true,
  },
  amountColumn: {
    type: String,
    required: true,
  },
});

const emits = defineEmits([
  'checkStateChanged',
  'initialAmountChanged',
  'selectedDateColumn',
  'selectedDescriptionColumn',
  'selectedAmountColumn',
]);

const appStore = useAppStore();

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

const noFileLoaded = computed(() => appStore.csvfile.rowCount === 0);
const dateItems = computed(() => (appStore.csvfile.rowCount === 0 ? [] : columnItems()));
const descriptionItems = computed(() => (appStore.csvfile.rowCount === 0 ? [] : columnItems()));
const amountItems = computed(() => (appStore.csvfile.rowCount === 0 ? [] : columnItems()));

const notifyCheckState = (value) => {
  emits('checkStateChanged', value);
};

const notifyInitialAmount = (value) => {
  emits('initialAmountChanged', value);
};

const notifyDateColumnSelected = (value) => {
  emits('selectedDateColumn', value);
};

const notifyDescriptionColumnSelected = (value) => {
  emits('selectedDescriptionColumn', value);
};

const notifyAmountColumnSelected = (value) => {
  emits('selectedAmountColumn', value);
};
</script>
