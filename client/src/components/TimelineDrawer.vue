<template>
  <v-navigation-drawer
    :model-value="showDrawer"
    :fixed="$vuetify.display.mdAndDown"
    :bottom="$vuetify.display.xs"
    location="right"
  >
    <v-card>
      <v-card-text class="align-start mt-2 mr-2">
        <v-list>
          <div
            v-for="(categoryItem, index) in categoriesNames"
            :key="index"
          >
            <v-list-item>
              <template #prepend>
                <v-list-item-action start>
                  <v-checkbox-btn
                    :model-value="selectedCategories"
                    :value="categoryItem"
                    @update:model-value="categoryUpdated"
                  ></v-checkbox-btn>
                </v-list-item-action>
              </template>
              <v-list-item-title>{{ categoryItem }}</v-list-item-title>
            </v-list-item>
          </div>
        </v-list>
      </v-card-text>
      <v-card-text class="align-start mt-2 mr-2">
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
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const emits = defineEmits(['updateCategories', 'updatePeriod', 'update', 'close']);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
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
const selectedCategories = computed(() => props.categories);
const selectedPeriod = computed(() => props.period);
const notReadyToQuery = () => props.selectedPeriod === '';

const categoryUpdated = (categories) => {
  emits('updateCategories', categories);
};

const periodUpdated = (period) => {
  emits('updatePeriod', period);
};
const search = () => {
  emits('update');
};
</script>
