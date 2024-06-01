<template>
  <a>{{ $t('global.hello') }}</a>
  <v-icon icon="$home" />
  <v-btn @click.stop="showCategories">CLICK</v-btn>
</template>

<script setup>
import { useApi } from './plugins/api';

const api = useApi();

const categories = async () => {
  try {
    const serverCategories = await api.categories();
    console.log(serverCategories);
  } catch (error) {
    console.log(api.getErrorMessage(error));
  }
};


const showCategories = async () => {
  categories();
};

</script>
