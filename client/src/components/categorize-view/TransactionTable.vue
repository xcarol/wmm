<template>
  <v-data-table-virtual
    :model-value="selectedItems"
    :items="tableItems"
    show-select
    fixed-header
    :height="height"
    @update:model-value="updateModelValue"
  >
    <template #[`item.description`]="{ item }">
      <v-tooltip
        :text="item.description"
        :disabled="item.description === truncated(item.description)"
        location="bottom"
      >
        <template #activator="{ props }">
          <div>
            <span
              class="cursor-pointer"
              v-bind="props"
              @keypress="categorizeFilter(item)"
              @click.stop="categorizeFilter(item)"
              >{{ truncated(item.description) }}&nbsp;&nbsp;</span
            >
            <v-tooltip
              :text="$t('categorizeView.searchTransactionDescription')"
              location="bottom"
            >
              <template #activator="{ innerProps }">
                <v-icon
                  icon="$open-in-new"
                  size="x-small"
                  v-bind="innerProps"
                  class="cursor-pointer"
                  @click.stop="searchTheWeb(item.description)"
                ></v-icon>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-tooltip>
    </template>
  </v-data-table-virtual>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { _ } from 'lodash';
import { categorizeUrlPath } from '../../models/categorize';

const emits = defineEmits(['updateModelValue']);

defineProps({
  selectedItems: {
    type: Array,
    required: true,
  },
  tableItems: {
    type: Array,
    required: true,
  },
  height: {
    type: Number,
    default: 200,
  },
});

const { t: $t } = useI18n();
const router = useRouter();

const searchTheWeb = (search) => window.open(`https://www.google.com/search?q=${search}`, '_blank');

const truncated = (text) =>
  _.truncate(text, { options: { length: 50, omission: '...', separator: ' ' } });

const categorizeFilter = (transaction) => {
  const { description, category } = transaction;
  router.push(categorizeUrlPath(description, category));
};

const updateModelValue = (modelValue) => {
  emits('updateModelValue', modelValue);
};
</script>
