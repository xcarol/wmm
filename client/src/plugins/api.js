/* eslint-disable no-param-reassign */
class Api {
  endpoints = {
    banksNames: '/banks/names',
    bankInstitutions: '/banks/institutions',
    registeredBanks: '/banks/registered',
    deleteBank: '/banks/delete?bank_id={1}',
    refreshBank: '/banks/refresh?bank_id={1}',
    bankRegisterInit: '/banks/register/init?institution_id={1}&redirect_url={2}',
    bankRegisterComplete: '/banks/register/complete?requisition_id={1}&requisition_name={2}',
    banksBalance: '/banks/balance?bank={1}&start={2}&end={3}',
    categoriesNames: '/categories/names',
    filters: '/categories/filters?category={1}',
    createFilter: '/categories/filter',
    updateFilter: '/categories/filter',
    deleteFilter: '/categories/filter?filter={1}',
    deleteCategory: '/categories?category={1}',
    renameCategory: '/categories/rename',
    transactions: '/transactions',
    addTransaction: '/transactions/add?date={1}&bank={2}&description={3}&amount={4}',
    transactionsUpdateCategory: '/transactions/category',
    transactionsCategoryBalance: '/transactions/category?category={1}&start={2}&end={3}',
    transactionsCategoryFiltersBalance:
      '/transactions/category?category={1}&filter={2}&start={3}&end={4}',
    transactionsCategoryTimeline:
      '/transactions/timeline?category={1}&period={2}&start={3}&end={4}',
    transactionsBankTimeline: '/transactions/timeline?bank={1}&period={2}&start={3}&end={4}',
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

    if (
      error &&
      error.response &&
      error.response.data &&
      JSON.stringify(error.response.data) !== '{}'
    ) {
      return JSON.stringify(error.response.data);
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

  addTransaction(date, bank, category, description, amount) {
    let url = Api.endpoint(this.endpoints.addTransaction, date, bank, description, amount);

    if (category) {
      url += `&category=${category}`;
    }

    return this.axios.get(url);
  }

  addTransactions(transactions) {
    const url = Api.endpoint(this.endpoints.transactions);
    return this.axios.post(url, { transactions });
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
    let url = Api.endpoint(this.endpoints.transactions);
    let useAnd = false;

    if (bank || startDate || endDate || category || filter) {
      url += '?';

      if (bank) {
        url += `bank=${bank}`;
        useAnd = true;
      }

      if (startDate) {
        if (useAnd) {
          url += '&';
        }
        url += `start=${startDate}`;
        useAnd = true;
      }

      if (endDate) {
        if (useAnd) {
          url += '&';
        }
        url += `end=${endDate}`;
        useAnd = true;
      }

      if (category) {
        if (useAnd) {
          url += '&';
        }
        url += `category=${category}`;
        useAnd = true;
      }

      if (filter) {
        if (useAnd) {
          url += '&';
        }
        url += `filter=${filter}`;
      }
    }
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

  categoryTimeline(category, period, start, end) {
    const url = Api.endpoint(
      this.endpoints.transactionsCategoryTimeline,
      category,
      period,
      start,
      end,
    );
    return this.axios.get(url);
  }

  bankTimeline(bank, period, start, end) {
    const url = Api.endpoint(this.endpoints.transactionsBankTimeline, bank, period, start, end);
    return this.axios.get(url);
  }

  bankInstitutions() {
    const url = Api.endpoint(this.endpoints.bankInstitutions);
    return this.axios.get(url);
  }

  bankRegisterInit(id, link) {
    const url = Api.endpoint(this.endpoints.bankRegisterInit, id, link);
    return this.axios.get(url);
  }

  bankRegisterComplete(requisitionName, requisitionId) {
    const url = Api.endpoint(this.endpoints.bankRegisterComplete, requisitionId, requisitionName);
    return this.axios.get(url);
  }

  registeredBanks() {
    const url = Api.endpoint(this.endpoints.registeredBanks);
    return this.axios.get(url);
  }

  deleteBank(bankId) {
    const url = Api.endpoint(this.endpoints.deleteBank, bankId);
    return this.axios.get(url);
  }

  refreshBank(bankId) {
    const url = Api.endpoint(this.endpoints.refreshBank, bankId);
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
