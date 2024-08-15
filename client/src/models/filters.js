import { useApi } from "../plugins/api";
import { useAppStore } from '../stores/app';

export const getCategoriesNames = async () => {
  const api = useApi();
  const appStore = useAppStore();

  let names = [];

  try {
    const dbNames = await api.categoriesNames();
    names = dbNames.data;
  } catch (e) {
    appStore.alertMessage = api.getErrorMessage(e);
  }

  return names;
};

export default {
  getCategoriesNames,
};