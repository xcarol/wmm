<template>
  <v-navigation-drawer
    :model-value="showDrawer"
    :fixed="$vuetify.display.mdAndDown"
    :bottom="$vuetify.display.xs"
  >
    <div :items="menuOptions">
      <v-list>
        <div
          v-for="(item, index) in menuOptions"
          :key="index"
        >
          <div v-if="item.value !== undefined">
            <v-list-item @click="selectItem(item)">
              {{ item.title }}
            </v-list-item>
          </div>
          <div v-else-if="item.children !== undefined">
            <v-list-group>
              <template #activator="{ props: subprops }">
                <v-list-item
                  v-bind="subprops"
                  :title="item.title"
                ></v-list-item>
              </template>
              <v-list-item
                v-for="(subitem, subindex) in item.children"
                :key="subindex"
                @click="selectItem(subitem)"
              >
                {{ subitem.title }}
              </v-list-item>
            </v-list-group>
          </div>
        </div>
      </v-list>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t: $t } = useI18n();
const router = useRouter();

const menuOptions = [
  {
    title: $t('mainDrawer.import'),
    value: '/import',
    barTitle: $t('importView.title'),
  },
  {
    title: $t('mainDrawer.categorize'),
    value: '/categorize',
    barTitle: $t('categorizeView.title'),
  },
  {
    title: $t('mainDrawer.addTransaction'),
    value: '/add-transaction',
    barTitle: $t('addTransactionView.title'),
  },
  {
    title: $t('mainDrawer.duplicates'),
    value: '/duplicates',
    barTitle: $t('duplicatesView.title'),
  },
  {
    title: $t('mainDrawer.sql'),
    value: '/sql',
    barTitle: $t('sqlView.title'),
  },
  {
    title: $t('mainDrawer.filters'),
    value: '/filters',
    barTitle: $t('filtersView.title'),
  },
  {
    title: $t('mainDrawer.browse'),
    children: [
      {
        title: $t('mainDrawer.browseTransactions'),
        value: '/browse/transactions',
        barTitle: $t('browseTransactionsView.title'),
      },
      {
        title: $t('mainDrawer.browseCategories'),
        value: '/browse/categories',
        barTitle: $t('browseCategoriesView.title'),
      },
      {
        title: $t('mainDrawer.browseTimeline'),
        value: '/browse/timeline',
        barTitle: $t('browseTimelineView.title'),
      },
    ],
  },
];

const emits = defineEmits(['onOptionSelected']);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const showDrawer = computed(() => props.show);

const selectItem = (item) => {
  emits('onOptionSelected', item.barTitle);
  router.push(item.value);
};

router.beforeEach((to) => {
  if (to.path === '/') {
    emits('onOptionSelected', "Where's My Money");
    return;
  }

  menuOptions.forEach((menuOption) => {
    if (menuOption.value === to.path) {
      emits('onOptionSelected', menuOption.barTitle);
    }

    if (menuOption.children) {
      menuOption.children.forEach((submenuOption) => {
        if (submenuOption.value === to.path) {
          emits('onOptionSelected', submenuOption.barTitle);
        }
      });
    }
  });
});
</script>
