<template>
  <v-navigation-drawer
    :model-value="showDrawer"
    :fixed="$vuetify.display.mdAndDown"
    :bottom="$vuetify.display.xs"
  >
    <v-list :items="menuOptions">
      <v-list-item
        v-for="(item, index) in menuOptions"
        :key="index"
        @click="selectItem(item)"
      >
        {{ item.title }}
      </v-list-item>
    </v-list>
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
    title: $t('mainDrawer.sql'),
    value: '/sql',
    barTitle: $t('sqlView.title'),
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

  menuOptions.forEach((item) => {
    if (item.value === to.path) {
      emits('onOptionSelected', item.barTitle);
    }
  });
});
</script>
