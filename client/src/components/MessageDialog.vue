<template>
  <v-dialog
    :model-value="show"
    max-width="600px"
    :fullscreen="$vuetify.display.xs"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="message"
          readonly
          no-resize
          variant="outlined"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn
          v-show="showNo"
          color="secondary"
          @click.stop="no"
        >
          {{ $t('dialog.no') }}</v-btn
        >
        <v-btn
          v-show="showYes"
          variant="flat"
          @click.stop="yes"
          >{{ $t('dialog.yes') }}</v-btn
        >
        <v-btn
          v-show="showCancel"
          color="secondary"
          @click.stop="cancel"
        >
          {{ $t('dialog.cancel') }}</v-btn
        >
        <v-btn
          v-show="showOk"
          variant="flat"
          @click.stop="ok"
        >
          {{ $t('dialog.ok') }}</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useMessageDialogStore } from '../stores/messageDialog';

const store = useMessageDialogStore();

const show = computed(() => store.show);
const title = computed(() => store.title);
const message = computed(() => store.message);

const showYes = computed(() => typeof store.yes === 'function');
const yes = () => {
  store.show = false;
  store.yes();
};

const showNo = computed(() => typeof store.no === 'function');
const no = () => {
  store.show = false;
  store.no();
};

const showOk = computed(() => typeof store.ok === 'function');
const ok = () => {
  store.show = false;
  store.ok();
};

const showCancel = computed(() => typeof store.cancel === 'function');
const cancel = () => {
  store.show = false;
  if (typeof store.cancel === 'function') {
    store.cancel();
  }
};
</script>
