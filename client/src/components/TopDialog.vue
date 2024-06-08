<template>
  <v-dialog
    :model-value="show"
    max-width="600px"
    :fullscreen="$vuetify.display.xs"
    scrollable
    persistent
  >
    <v-card>
      <v-card-title>
        <span class="headline">{{ $t('progress.title') }}</span>
      </v-card-title>
      <v-card-text>
        <v-container grid-list-md>
          <v-row>
            <v-col>
              {{ description }}
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-progress-linear
              :model-value="step"
              :max="maxSteps"
              :indeterminate="maxSteps===0">
            </v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          @click.stop="cancel"
        >
          {{ $t('global.cancel') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '../stores/app';

const appStore = useAppStore();

const show = computed(() => appStore.progressIsActive);
const description = computed(() => appStore.progress.description);
const maxSteps = computed(() => appStore.progress.maxSteps);
const step = computed(() => appStore.progress.step);

const cancel = () => {
  appStore.cancelProgress();
};
</script>
