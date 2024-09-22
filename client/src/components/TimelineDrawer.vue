<template>
  <v-navigation-drawer
    :model-value="showDrawer"
    :fixed="$vuetify.display.mdAndDown"
    :bottom="$vuetify.display.xs"
    location="right"
    @update:model-value="close"
  >
    <v-card>
      <v-card-text class="align-start mt-2 mr-2">
        <v-select
          :model-value="selectedCategory"
          class="ml-2"
          :items="categoriesNames"
          :label="$t('browseTimelineView.categoryLabel')"
          @update:model-value="categoryUpdated"
        />
        <v-select
          :model-value="selectedPeriod"
          class="ml-4"
          :items="periodsNames"
          :label="$t('browseTimelineView.periodLabel')"
          @update:model-value="periodUpdated"
        />
        <v-btn
          class="ml-4"
          :disabled="notReadyToQuery()"
          @click.stop="search"
        >
          {{ $t('browseTimelineView.searchButton') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const emits = defineEmits([
  'categoryUpdated',
  'periodUpdated',
  'bankUpdated',
  'update',
  'close',
]);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: true,
  },
  period: {
    type: String,
    required: true,
  },
  categoriesNames: {
    type: Array,
    required: true,
  },
  periodsNames: {
    type: Array,
    required: true,
  },
});

const showDrawer = computed(() => props.show);
const selectedCategory = computed(() => props.category);
const selectedPeriod = computed(() => props.period);
const notReadyToQuery = () => props.selectedPeriod === '';

const search = () => {
  emits('update', { category: selectedCategory.value, period: selectedPeriod.value });
};

const close = () => {
  emits('close');
};

const categoryUpdated = (category) => {
  emits('categoryUpdated', category);
};

const periodUpdated = (period) => {
  emits('periodUpdated', period);
};
</script>
