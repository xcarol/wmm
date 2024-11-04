<template>
  <v-dialog
    :model-value="show"
    :fullscreen="$vuetify.display.xs"
    max-width="auto"
    width="auto"
  >
    <v-card>
      <v-card-actions class="calendar-card">
        <v-calendar
          :initial-page="props.initialEndPage"
          :min-date="props.minDate"
          :max-date="props.maxDate"
          :attributes="props.attributes"
          is-dark="system"
          @dayclick="onDateSelected"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue';
import {
  VCard,
  VCardActions,
  VDialog,
} from 'vuetify/lib/components/index.mjs';

// eslint-disable-next-line import/no-unresolved
import 'v-calendar/style.css';

const VCalendar = defineAsyncComponent(() =>
  import('v-calendar').then((module) => module.Calendar),
);

const emits = defineEmits(['dateSelected']);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  initialPage: {
    type: Object,
    default() {},
  },
  minDate: {
    type: String,
    default: undefined,
  },
  maxDate: {
    type: String,
    default: undefined,
  },
  attributes: {
    type: Array,
    default() {
      return [{ highlight: true }];
    },
  },
});

const show = computed(() => props.show);

const onDateSelected = (date) => {
  emits('dateSelected', date.date);
};
</script>

<style scoped>
.calendar-card {
  padding: 0;
  display: inline-block;
  width: auto;
}
</style>
