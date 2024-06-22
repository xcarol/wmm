<template>
  <v-dialog
    :model-value="show"
    max-width="600px"
    :fullscreen="$vuetify.display.xs"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title>{{ $t('dialogRenameCategory.title') }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="categoryCurrentName"
          disabled
          :label="$t('dialogRenameCategory.categoryLabel')"
        ></v-text-field>
        <v-text-field
          v-model="categoryNewName"
          :label="$t('dialogRenameCategory.newCategoryLabel')"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn @click.stop="cancel"> {{ $t('dialog.cancel') }}</v-btn>
        <v-btn
          :disabled="canRenameCategory"
          @click.stop="ok"
          >{{ $t('dialog.ok') }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUpdate } from 'vue';

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
});

const show = computed(() => props.show);
const categoryCurrentName = ref(props.category);
const categoryNewName = ref('');

watch(show, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    categoryCurrentName.value = props.category;
  }
});

const ok = () => {
  emits('onOk', { category: categoryNewName.value });
};

const cancel = () => {
  emits('onCancel');
};

const canRenameCategory = computed(() => {
  return !!(categoryCurrentName.value.length === 0 || categoryNewName.value.length === 0);
});
onBeforeUpdate(() => {categoryNewName.value = '';});
</script>
