<template>
  <v-data-table-virtual
    :model-value="selectedItems"
    :items="tableItems"
    show-select
    fixed-header
    class="table-height"
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
import {
  VDataTableVirtual, VTooltip, VIcon,
} from 'vuetify/lib/components/index.mjs';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import truncate from 'lodash/truncate';
import { categorizeUrlPath } from '../../helpers/categorize';

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
});

const { t: $t } = useI18n();
const router = useRouter();

const searchTheWeb = (search) => window.open(`https://www.google.com/search?q=${search}`, '_blank');

const truncated = (text) =>
  truncate(text, { options: { length: 50, omission: '...', separator: ' ' } });

const categorizeFilter = (transaction) => {
  const { description, category } = transaction;
  router.push(categorizeUrlPath(description, category));
};

const updateModelValue = (modelValue) => {
  emits('updateModelValue', modelValue);
};
</script>

<style scoped>
.table-height {
  max-height: 50vh;
}
</style>
