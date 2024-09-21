<template>
  <v-navigation-drawer
    v-model="showDrawer"
    :fixed="$vuetify.display.mdAndDown"
    :bottom="$vuetify.display.xs"
    location="right"
  >
    <v-card>
      <v-card-actions class="align-start mt-2 mr-2">
        <v-select
          v-model="selectedCategory"
          class="ml-2"
          :items="categoriesNames"
          :label="$t('browseTimelineView.categoryLabel')"
        />
        <v-select
          v-model="selectedPeriod"
          class="ml-4"
          :items="periodsNames"
          :label="$t('browseTimelineView.periodLabel')"
        />
        <v-btn
          class="ml-4"
          :disabled="notReadyToQuery()"
          @click.stop="optionSelected"
        >
          {{ $t('browseTimelineView.searchButton') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const emits = defineEmits(['optionsSelected']);

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
const selectedCategory = ref(props.category);
const selectedPeriod = ref(props.period);
const notReadyToQuery = () => props.selectedPeriod === '';

const optionSelected = () => {
  emits('optionsSelected', { category: selectedCategory.value, period: selectedPeriod.value });
};
</script>
