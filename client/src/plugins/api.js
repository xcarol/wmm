/* eslint-disable no-param-reassign */
class Api {
  endpoints = {
    banksNames: '/banks/names',
    banksBalance: '/banks/balance?bank={1}&start={2}&end={3}',
    categoriesNames: '/categories/names',
    filtersNames: '/categories?category={1}',
    createFilter: '/categories/filter',
    applyFilter: '/categories/filter',
    deleteFilters: '/categories/filters',
    deleteCategories: '/categories',
    renameCategory: '/categories/rename',
    transactions: '/transactions',
    transactionsOfBank: '/transactions?bank={1}',
    transactionsApplyCategory: '/transactions/category',
    transactionsCategorize: '/transactions/category',
    resetCategoryFromTransactions: '/transactions/category',
    updateTransactionsByFilter: '/transactions/filter',
    uncategorizedTransactions: '/transactions/uncategorized?filter={1}',
    duplicated: '/transactions/duplicated',
    sql: '/sql',
    backupDatabase: '/sql/backup',
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

  banksNames() {
    const url = Api.endpoint(this.endpoints.banksNames);
    return this.axios.get(url);
  }

  categoriesNames() {
    const url = Api.endpoint(this.endpoints.categoriesNames);
    return this.axios.get(url);
  }

  filtersNames(category) {
    const url = Api.endpoint(this.endpoints.filtersNames, category);
    return this.axios.get(url);
  }

  createFilter(category, filter) {
    const url = Api.endpoint(this.endpoints.createFilter);
    return this.axios.post(url, { category, filter });
  }

  applyFilter(category, filter) {
    const url = Api.endpoint(this.endpoints.applyFilter);
    return this.axios.put(url, { category, filter });
  }

  deleteFilters(filters) {
    const url = Api.endpoint(this.endpoints.deleteFilters);
    return this.axios.put(url, { filters });
  }

  deleteCategories(categories) {
    const url = Api.endpoint(this.endpoints.deleteCategories);
    return this.axios.put(url, { categories });
  }

  renameCategory(oldName, newName) {
    const url = Api.endpoint(this.endpoints.renameCategory);
    return this.axios.post(url, { oldName, newName });
  }

  addTransaction(date, description, amount, bank) {
    const url = Api.endpoint(this.endpoints.transactions);
    return this.axios.post(url, { date, description, amount, bank });
  }

  deleteTransactions(transactions) {
    const url = Api.endpoint(this.endpoints.transactions);
    return this.axios.put(url, { transactions });
  }

  updateTransactionsCategory(transactions, category) {
    const url = Api.endpoint(this.endpoints.transactionsApplyCategory);
    return this.axios.put(url, { operation: 'apply', transactions, category });
  }

  applyCategoryToTransactions(category) {
    const url = Api.endpoint(this.endpoints.transactionsCategorize);
    return this.axios.put(url, { operation: 'categorize', category });
  }

  resetCategoryFromTransactions(categories) {
    const url = Api.endpoint(this.endpoints.resetCategoryFromTransactions);
    return this.axios.put(url, { operation: 'reset', categories });
  }

  updateTransactionsByFilter(filter) {
    const url = Api.endpoint(this.endpoints.updateTransactionsByFilter);
    return this.axios.put(url, { filter });
  }

  searchTransactionsByCategory(filter) {
    const url = Api.endpoint(this.endpoints.uncategorizedTransactions, filter ?? '');
    return this.axios.get(url);
  }

  duplicatedTransactions() {
    const url = Api.endpoint(this.endpoints.duplicated);
    return this.axios.get(url);
  }

  markTransactionsAsNotDuplicated(transactions) {
    const url = Api.endpoint(this.endpoints.duplicated);
    return this.axios.put(url, { transactions });
  }

  executeQuery(query) {
    const url = Api.endpoint(this.endpoints.sql);
    return this.axios.post(url, { query });
  }

  backupDatabase() {
    const url = Api.endpoint(this.endpoints.backupDatabase);
    return this.axios.get(url);
  }

  bankBalance(bank, start, end) {
    const url = Api.endpoint(this.endpoints.banksBalance, bank, start, end);
    return this.axios.get(url);
  }

  bankTransactions(bank) {
    const url = Api.endpoint(this.endpoints.transactionsOfBank, bank);
    return this.axios.get(url);
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
