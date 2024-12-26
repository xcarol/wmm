<template>
  <v-navigation-drawer
    :model-value="showDrawer"
    :fixed="$vuetify.display.mdAndDown"
    :bottom="$vuetify.display.xs"
    location="left"
    @update:model-value="modelChanged"
  >
    <v-card flat>
      <v-card-text class="align-start">
        <v-btn-toggle
          elevation="2"
          :model-value="chartType"
          @update:model-value="typeChanged"
        >
          <v-btn>
            {{ $t('browseTimelineView.banksLabel') }}
          </v-btn>
          <v-btn>
            {{ $t('browseTimelineView.categoriesLabel') }}
          </v-btn>
        </v-btn-toggle>
        <v-virtual-scroll
          class="my-4"
          :items="selectableNames"
          :height="adjustedHeight"
        >
          <template #default="{ item }">
            <v-list-item :title="`${item}`">
              <template #prepend>
                <v-list-item-action start>
                  <v-checkbox-btn
                    :model-value="selectedCategories"
                    :value="item"
                    @update:model-value="selectedUpdated"
                  ></v-checkbox-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </template>
        </v-virtual-scroll>
        <v-select
          v-if="filterNames.length > 0"
          :model-value="selectedFilter"
          :items="filterNames"
          :label="$t('browseTimelineView.filtersLabel')"
          @update:model-value="filterUpdated"
        />
        <v-select
          :model-value="selectedPeriod"
          :items="periodsNames"
          :label="$t('browseTimelineView.periodLabel')"
          @update:model-value="periodUpdated"
        />
        <v-btn
          :disabled="notReadyToQuery()"
          @click.stop="search()"
        >
          {{ $t('browseTimelineView.searchButton') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue';
import {
  VBtn,
  VBtnToggle,
  VCard,
  VCardText,
  VCheckboxBtn,
  VListItem,
  VListItemAction,
  VNavigationDrawer,
  VSelect,
  VVirtualScroll,
} from 'vuetify/lib/components/index.mjs';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';

const { t: $t } = useI18n();
const appStore = useAppStore();

const emits = defineEmits([
  'modelChanged',
  'typeChanged',
  'updateSelected',
  'updateFilter',
  'updatePeriod',
  'update',
  'close',
]);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  chartType: {
    type: Number,
    default: 0,
  },
  selectedNames: {
    type: Array,
    required: true,
  },
  selectedPeriod: {
    type: String,
    required: true,
  },
  selectedFilter: {
    type: String,
    required: true,
  },
  selectableNames: {
    type: Array,
    required: true,
  },
  periodsNames: {
    type: Array,
    required: true,
  },
  filterNames: {
    type: Array,
    required: true,
  },
});

const adjustedHeight = computed(() =>
  props.filterNames.length === 0 ? appStore.viewHeight - 280 : appStore.viewHeight - 340,
);
const showDrawer = computed(() => props.show);
const selectedCategories = computed(() => props.selectedNames);
const selectedPeriod = computed(() => props.selectedPeriod);
const notReadyToQuery = () => props.selectedPeriod === '';

const modelChanged = (model) => {
  emits('modelChanged', model);
};

const typeChanged = (type) => {
  emits('typeChanged', type);
};

const selectedUpdated = (selectedItems) => {
  emits('updateSelected', selectedItems);
};

const periodUpdated = (period) => {
  emits('updatePeriod', period);
};

const filterUpdated = (filter) => {
  emits('updateFilter', filter);
};

const search = () => {
  emits('update');
};
</script>
