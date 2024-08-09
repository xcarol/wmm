/* eslint-disable no-param-reassign */
class Api {
  endpoints = {
    banksNames: '/banks/names',
    banksBalance: '/banks/balance?bank={1}&start={2}&end={3}',
    categoriesNames: '/categories/names',
    filters: '/categories/filters?category={1}',
    createFilter: '/categories/filter',
    updateFilter: '/categories/filter',
    deleteFilter: '/categories/filter?filter={1}',
    deleteCategory: '/categories?category={1}',
    renameCategory: '/categories/rename',
    transactions: '/transactions',
    transactionsOfBank: '/transactions?bank={1}&start={2}&end={3}&category={4}&filter={5}',
    transactionsUpdateCategory: '/transactions/category',
    transactionsCategoryBalance: '/transactions/category?category={1}&start={2}&end={3}',
    transactionsCategoryFiltersBalance:
      '/transactions/category?category={1}&filter={2}&start={3}&end={4}',
    applyFilters: '/transactions/category',
    resetCategoryFromTransactions: '/transactions/category',
    filterTransactions: '/transactions?filter={1}&category={2}',
    duplicated: '/transactions/duplicated',
    years: '/transactions/years',
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

  getFilters(category) {
    const url = Api.endpoint(this.endpoints.filters, category);
    return this.axios.get(url);
  }

  createFilter(category, filter, label) {
    const url = Api.endpoint(this.endpoints.createFilter);
    return this.axios.post(url, { category, filter, label });
  }

  updateFilter(filterId, filter, label) {
    const url = Api.endpoint(this.endpoints.updateFilter);
    return this.axios.put(url, { filterId, filter, label });
  }

  deleteFilter(filterId) {
    const url = Api.endpoint(this.endpoints.deleteFilter, filterId);
    return this.axios.delete(url);
  }

  deleteCategory(category) {
    const url = Api.endpoint(this.endpoints.deleteCategory, category);
    return this.axios.delete(url);
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

  applyFilters() {
    const url = Api.endpoint(this.endpoints.applyFilters);
    return this.axios.put(url, { operation: 'apply' });
  }

  updateTransactionsCategory(transactions, category) {
    const url = Api.endpoint(this.endpoints.transactionsUpdateCategory);
    return this.axios.put(url, { operation: 'update', transactions, category });
  }

  resetCategoryFromTransactions(category) {
    const url = Api.endpoint(this.endpoints.resetCategoryFromTransactions);
    return this.axios.put(url, { operation: 'reset', category });
  }

  searchTransactions(filter, category) {
    const url = Api.endpoint(this.endpoints.filterTransactions, filter ?? '', category ?? '');
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

  bankTransactions(bank, startDate, endDate, category, filter) {
    const url = Api.endpoint(
      this.endpoints.transactionsOfBank,
      bank,
      startDate,
      endDate,
      category,
      filter,
    );
    return this.axios.get(url);
  }

  getYears() {
    const url = Api.endpoint(this.endpoints.years);
    return this.axios.get(url);
  }

  categoryBalance(category, start, end) {
    const url = Api.endpoint(this.endpoints.transactionsCategoryBalance, category, start, end);
    return this.axios.get(url);
  }

  filterBalance(category, filter, start, end) {
    const url = Api.endpoint(
      this.endpoints.transactionsCategoryFiltersBalance,
      category,
      filter,
      start,
      end,
    );
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
