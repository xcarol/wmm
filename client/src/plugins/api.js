/* eslint-disable no-param-reassign */
class Api {
  endpoints = {
    categoryNames: 'category/names',
    bankNames: 'bank/names',
    transactions: 'transaction',
    deleteTransactions: 'transaction/delete',
    updateTransactionsCategory: 'transaction/category',
    updateTransactionsByFilter: 'transaction/filter',
    uncategorizedTransactions: 'transaction/uncategorized?filter={1}',
    duplicated: 'transaction/duplicated',
    resetCategoryFromTransactions: 'transaction/category/reset',
    filters: 'filter',
    applyFilter: 'filter/apply',
    deleteFilters: 'filter/delete',
    categoryFilters: 'filter?category={1}',
    renameCategory: 'filter/category/rename',
    deleteCategories: 'filter/category/delete',
    applyCategoryToTransactions: 'filter/category/apply',
    sql: 'sql',
    backupDatabase: 'sql/backup',
  };

  static endpoint(endpoint, ...args) {
    let count = 0;

    args.forEach((element) => {
      count += 1;
      endpoint = endpoint.replace(`{${count}}`, element);
    });

    return endpoint;
  }

  // eslint-disable-next-line class-methods-use-this
  getErrorMessage(error) {
    if (error && error.response && error.response.data && error.response.data.message) {
      return error.response.data.message;
    }

    if (error && error.response && error.response.data) {
      return error.response.data;
    }

    if (error && error.response && error.response.statusText) {
      return error.response.statusText;
    }

    return error.toString();
  }

  categoryNames() {
    const url = Api.endpoint(this.endpoints.categoryNames);
    return this.axios.get(url);
  }

  bankNames() {
    const url = Api.endpoint(this.endpoints.bankNames);
    return this.axios.get(url);
  }

  addTransaction(date, description, amount, bank) {
    const url = Api.endpoint(this.endpoints.transactions);
    return this.axios.put(url, { date, description, amount, bank });
  }

  executeQuery(query) {
    const url = Api.endpoint(this.endpoints.sql);
    return this.axios.post(url, { query });
  }

  backupDatabase() {
    const url = Api.endpoint(this.endpoints.backupDatabase);
    return this.axios.get(url);
  }

  searchTransactionsByCategory(filter) {
    const url = Api.endpoint(this.endpoints.uncategorizedTransactions, filter ?? '');
    return this.axios.get(url);
  }

  updateTransactionsCategory(transactions, category) {
    const url = Api.endpoint(this.endpoints.updateTransactionsCategory);
    return this.axios.post(url, { transactions, category });
  }

  updateTransactionsByFilter(filter) {
    const url = Api.endpoint(this.endpoints.updateTransactionsByFilter);
    return this.axios.post(url, { filter });
  }

  createFilter(category, filter) {
    const url = Api.endpoint(this.endpoints.filters);
    return this.axios.put(url, { category, filter });
  }

  duplicatedTransactions() {
    const url = Api.endpoint(this.endpoints.duplicated);
    return this.axios.get(url);
  }

  markTransactionsAsNotDuplicated(transactions) {
    const url = Api.endpoint(this.endpoints.duplicated);
    return this.axios.post(url, { transactions });
  }

  deleteTransactions(transactions) {
    const url = Api.endpoint(this.endpoints.deleteTransactions);
    return this.axios.post(url, { transactions });
  }

  deleteCategories(categories) {
    const url = Api.endpoint(this.endpoints.deleteCategories);
    return this.axios.post(url, { categories });
  }

  resetCategoryFromTransactions(categories) {
    const url = Api.endpoint(this.endpoints.resetCategoryFromTransactions);
    return this.axios.post(url, { categories });
  }

  applyCategoryToTransactions(category) {
    const url = Api.endpoint(this.endpoints.applyCategoryToTransactions);
    return this.axios.post(url, { category });
  }

  renameCategory(oldName, newName) {
    const url = Api.endpoint(this.endpoints.renameCategory);
    return this.axios.post(url, { oldName, newName });
  }

  getFilters(category) {
    const url = Api.endpoint(this.endpoints.categoryFilters, category);
    return this.axios.get(url);
  }

  deleteFilters(filters) {
    const url = Api.endpoint(this.endpoints.deleteFilters);
    return this.axios.post(url, { filters });
  }

  applyFilter(filter) {
    const url = Api.endpoint(this.endpoints.applyFilter);
    return this.axios.post(url, { filter });
  }
}

const api = new Api();

const ApiPlugin = {
  install(app, options) {
    app.config.globalProperties.api = api;
    api.axios = options.axios;
  },
  api,
};

export function useApi() {
  return api;
}

export default ApiPlugin;
