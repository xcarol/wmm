<template>
  <v-dialog
    :model-value="show"
    max-width="600px"
    :fullscreen="$vuetify.display.xs"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title>{{ $t('dialogNewFilter.title') }}</v-card-title>
      <v-card-text>
        <v-combobox
          v-model="categoryInput"
          :label="$t('dialogNewFilter.categoryLabel')"
          :items="categoryNames"
        />
        <v-text-field
          v-model="filterInput"
          :label="$t('dialogNewFilter.filterLabel')"
        ></v-text-field>
        <v-text-field
          v-model="labelInput"
          :label="$t('dialogNewFilter.labelLabel')"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click.stop="cancel"> {{ $t('dialog.cancel') }}</v-btn>
        <v-btn
          :disabled="canCreateNewFilter"
          variant="flat"
          @click.stop="ok"
          >{{ $t('dialog.ok') }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUpdate } from 'vue';
import {
  VBtn,
  VCard,
  VCardActions,
  VCardText,
  VCardTitle,
  VCombobox,
  VDialog,
  VTextField,
} from 'vuetify/lib/components/index.mjs';
import { getCategoriesNames } from '../../helpers/filters';

const emits = defineEmits(['onOk', 'onCancel']);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    default: '',
  },
  filter: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
});

const show = computed(() => props.show);
const categoryInput = ref(props.category);
const filterInput = ref(props.filter);
const labelInput = ref(props.label);
const categoryNames = ref(['']);

watch(show, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    categoryInput.value = props.category;
    filterInput.value = props.filter;
    labelInput.value = props.label;
  }
});

const ok = () => {
  emits('onOk', {
    category: categoryInput.value,
    filter: filterInput.value,
    label: labelInput.value,
  });
};

const cancel = () => {
  emits('onCancel');
};

const canCreateNewFilter = computed(() => {
  return !!(categoryInput.value.length === 0 || filterInput.value.length === 0);
});

const beforeUpdate = async () => {
  categoryNames.value = await getCategoriesNames();
};

onBeforeUpdate(() => beforeUpdate());
</script>
