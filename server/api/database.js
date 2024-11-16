const mysql = require('mysql2/promise');
const path = require('path');
const dayjs = require('dayjs');
const { execSync } = require('child_process');
const queries = require('../lib/transaction_queries');

const MAX_LEN = 200;

const connectionSettings = {
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'secret',
  database: process.env.DB_NAME ?? 'wmm',
  multipleStatements: true,
  dateStrings: true,
};

const sqlStatus = (err) => {
  return err.sqlState ? 400 : err.response ? err.response.status : 500;
};

async function getConnection() {
  return await mysql.createConnection(connectionSettings);
}

async function queryDatabase(query, parameters, errorMessage) {
  let connection;

  try {
    connection = await getConnection();
    return await connection.query(query, parameters);
  } catch (err) {
    if (errorMessage) {
      err.message = errorMessage(err);
    } else {
      err.message = `Error [${err}] executing query [${query}] with parameters [${parameters}].`;
    }
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function applyFilters() {
  const [filters] = await queryDatabase(
    queries.queryFiltersToApply,
    [],
    (err) => `Error [${err}] applying filters.`,
  );

  const results = [];

  for (let index = 0; index < filters.length; index++) {
    const filter = filters[index];
    results.push(
      await queryDatabase(
        queries.queryApplyFilter,
        [filter.category, filter.id, filter.filter],
        (err) => `Error [${err}] applying filters.`,
      ),
    );
  }

  let affectedRows = 0;
  for (let index = 0; index < results.length; index++) {
    const [result] = results[index];
    affectedRows += result.affectedRows;
  }

  return affectedRows;
}

async function addBank(
  institution_name,
  institution_id,
  requisition_id,
  accessDays,
  historicalDays,
) {
  if (institution_name.length > MAX_LEN) {
    throw new Error(`name: [${institution_name}] is longer than ${MAX_LEN}`);
  }

  if (institution_id.length > MAX_LEN) {
    throw new Error(`institution_id: [${institution_id}] is longer than ${MAX_LEN}`);
  }

  if (requisition_id.length > MAX_LEN) {
    throw new Error(`requisition_id: [${requisition_id}] is longer than ${MAX_LEN}`);
  }

  const dateAccessDays = dayjs().add(accessDays, 'days').format('YYYY-MM-DD');
  return queryDatabase(
    queries.queryAddBank,
    [institution_name, institution_id, requisition_id, dateAccessDays, historicalDays],
    (err) => `Error [${err}] adding bank ${institution_id} with requisition_id ${requisition_id}.`,
  );
}

async function deleteBank(bank_id) {
  return queryDatabase(
    queries.queryDeleteBank,
    [bank_id],
    (err) => `Error [${err}] deleting bank with institution_id ${bank_id}.`,
  );
}

async function getBankById(bank_id) {
  const result = await queryDatabase(
    queries.queryBankById,
    [bank_id],
    (err) => `Error [${err}] searching bank with institution_id ${bank_id}.`,
  );
  return result.at(0).at(0);
}

async function addFilter(category, filter, label) {
  return queryDatabase(
    queries.queryAddCategoryFilter,
    [category.slice(0, MAX_LEN), filter.slice(0, MAX_LEN), label.slice(0, MAX_LEN)],
    (err) => `Error [${err}] adding filter ${filter} with label ${label} to category ${category}.`,
  );
}

async function updateFilter(id, filter, label) {
  return queryDatabase(
    queries.queryUpdateFilter,
    [filter.slice(0, MAX_LEN), label.slice(0, MAX_LEN), id],
    (err) => `Error [${err}] updating filter ${filter} with label ${label}.`,
  );
}

async function renameCategory(oldName, newName) {
  const preparedNewName = newName.slice(0, MAX_LEN);

  await queryDatabase(
    queries.queryRenameCategoryFilters,
    [preparedNewName, oldName],
    (err) => `Error [${err}] renaming category [${oldName}] to new name [${preparedNewName}].`,
  );

  return queryDatabase(
    queries.queryRenameRowsCategory,
    [preparedNewName, oldName],
    (err) => `Error [${err}] renaming category [${oldName}] to new name [${preparedNewName}].`,
  );
}

async function getRegisteredBanks() {
  const result = await queryDatabase(
    queries.queryRegisteredBanks,
    [],
    (err) => `Error [${err}] retrieving registered banks.`,
  );
  return result.at(0);
}

async function getTransactions(bankName, startDate, endDate, category, filter) {
  let query = queries.queryTransactions;
  const params = [];

  if (bankName || startDate || endDate || typeof category === 'string' || filter) {
    let useAnd = false;
    query += ' WHERE ';

    if (bankName) {
      query += ' bank = ? ';
      params.push(bankName);
      useAnd = true;
    }

    if (startDate) {
      if (useAnd) {
        query += ' AND ';
      }
      query += ' date >= ? ';
      params.push(startDate);
      useAnd = true;
    }

    if (endDate) {
      if (useAnd) {
        query += ' AND ';
      }
      query += ' date <= ? ';
      params.push(endDate);
      useAnd = true;
    }

    if (typeof category === 'string') {
      if (useAnd) {
        query += ' AND ';
      }
      query += ' category = ? ';
      params.push(category);
      useAnd = true;
    }

    if (filter) {
      if (useAnd) {
        query += ' AND ';
      }
      query += ' description LIKE ? ';
      params.push(`%${filter}%`);
      useAnd = true;
    }
  }

  const result = await queryDatabase(
    query,
    params,
    (err) => `Error [${err}] retrieving transactions.`,
  );

  return result.at(0);
}

async function getDuplicatedTransactions() {
  return queryDatabase(
    queries.queryDuplicateRows,
    [],
    (err) => `Error [${err}] retrieving duplicated transactions.`,
  );
}

async function getYears() {
  const result = await queryDatabase(
    queries.queryYears,
    [],
    (err) => `Error [${err}] retrieving years from transactions.`,
  );
  return result.at(0).map((row) => row.year);
}

async function getBankBalance(bank, start, end) {
  const result = await queryDatabase(
    queries.queryBankBalances,
    [bank, start, end],
    (err) => `Error [${err}] retrieving bank balance.`,
  );
  return result.at(0).at(0);
}

async function getCategories() {
  const result = await queryDatabase(
    queries.queryCategoryNames,
    [],
    (err) => `Error [${err}] retrieving categories.`,
  );
  return result.at(0).map((row) => row.category);
}

async function getCategoryBalance(category, start, end) {
  const result = await queryDatabase(
    queries.queryCategoryBalance,
    [category, start, end],
    (err) => `Error [${err}] retrieving balance of categories.`,
  );
  return result.at(0).at(0);
}

async function getCategoryFiltersBalance(category, filter, start, end) {
  const result = await queryDatabase(
    queries.queryCategoryFiltersBalance,
    [category, filter, start, end],
    (err) => `Error [${err}] retrieving balance of categories by filter.`,
  );
  return result.at(0).at(0);
}

async function getCategoryNonFiltersBalance(category, start, end) {
  const filterNamesResult = await queryDatabase(
    queries.queryCategoryFilters,
    [category],
    (err) => `Error [${err}] retrieving filters for the category [${category}].`,
  );

  const filterNames = filterNamesResult.at(0);
  const queryBalancesWithoutCategory = queries.queryBalancesWithoutCategoryStart.concat(
    queries.queryBalancesWithoutCategoryDescription.repeat(filterNames.length),
    queries.queryBalancesWithoutCategoryEnd,
  );

  const parameters = [category, ...filterNames.map((filter) => `%${filter.filter}%`), start, end];
  const result = await queryDatabase(
    queryBalancesWithoutCategory,
    parameters,
    (err) => `Error [${err}] retrieving balance of categories without a filter.`,
  );

  return result.at(0);
}

async function getTimelineByBank(bank, period, start, end) {
  let query;
  switch (period) {
    case 'year':
      query = queries.queryBalancesTimelineByBankByYear;
      break;
    case 'month':
      query = queries.queryBalancesTimelineByBankByMonth;
      break;
    default:
      throw `Unknown period [${period}]`;
  }

  return queryDatabase(
    query,
    [bank, start, end],
    (err) =>
      `Error [${err}] retrieving the bank timeline for period [${period}] start [${start}] end [${end}].`,
  );
}

async function getTimelineByCategory(category, period, start, end) {
  let query;
  switch (period) {
    case 'year':
      query = queries.queryBalancesTimelineByCategoryByYear;
      break;
    case 'month':
      query = queries.queryBalancesTimelineByCategoryByMonth;
      break;
    case 'day':
      query = queries.queryBalancesTimelineByCategoryByDay;
      break;
    case 'unit':
      query = queries.queryBalancesTimelineByCategoryByUnit;
      break;
    default:
      throw `Unknown period [${period}]`;
  }

  return queryDatabase(
    query,
    [category, start, end],
    (err) =>
      `Error [${err}] retrieving the category [${category}] timeline for period [${period}] start [${start}] end [${end}].`,
  );
}

async function getCategoryFilters(category) {
  const result = await queryDatabase(
    queries.queryCategoryFilters,
    [category],
    (err) => `Error [${err}] retrieving filters for the category [${category}].`,
  );

  return result.at(0);
}

async function getBankNames() {
  const result = await queryDatabase(
    queries.queryBankNames,
    [],
    (err) => `Error [${err}] retrieving bank names.`,
  );
  return result.at(0).map((row) => row.bank);
}

async function addTransaction(date, bank, category, description, amount) {
  const result = await queryDatabase(
    queries.queryAddTransaction,
    [date, bank, category, description, amount],
    (err) =>
      `Error [${err}] adding a transaction with date: ${date}, bank: ${bank}, category: ${category}, description: ${description}, amount: ${amount}.`,
  );

  return result.at(0);
}

async function addTransactions(transactions) {
  let query;
  const parameters = [];

  if (transactions[0].transactionId) {
    query = queries.queryInsertTransactionsWithId;
    transactions.forEach((transaction) => {
      query += ' (?, ?, ?, ?, ?),';
      parameters.push(
        transaction.bank,
        transaction.date,
        transaction.description,
        transaction.amount,
        transaction.transactionId,
      );
    });
  } else {
    query = queries.queryInsertTransactions;
    transactions.forEach((transaction) => {
      query += ' (?, ?, ?, ?),';
      parameters.push(
        transaction.bank,
        transaction.date,
        transaction.description,
        transaction.amount,
      );
    });
  }

  query = query.slice(0, -1);

  const result = await queryDatabase(
    query,
    parameters,
    (err) => `Error [${err}] adding transactions: [${JSON.stringify(transactions)}].`,
  );

  return result.at(0);
}

async function deleteCategory(category) {
  return queryDatabase(
    queries.queryDeleteCategory,
    [category],
    (err) => `Error [${err}] deleting the category [${category}].`,
  );
}

async function deleteFilter(filterId) {
  return queryDatabase(
    queries.queryDeleteFilter,
    [filterId],
    (err) => `Error [${err}] deleting the filter with ID [${filterId}].`,
  );
}

async function deleteTransactions(transactions) {
  return queryDatabase(
    queries.queryDeleteRows,
    [transactions],
    (err) => `Error [${err}] deleting transactions [${transactions}].`,
  );
}

async function deleteNewerTransactions(bank, date) {
  const result = await queryDatabase(
    queries.queryDeleteRowsNewerThanDate,
    [bank, date],
    (err) => `Error [${err}] deleting transactions newer than ${date}.`,
  );
  return result.at(0);
}

async function executeSql(query) {
  return queryDatabase(query, [], (err) => `Error [${err}] executing query [${query}].`);
}

async function backupDatabase() {
  const filePath = path.join(__dirname, 'wmm.sql');

  try {
    execSync(
      `/usr/bin/mysqldump \
      --host=${process.env.DB_HOST} \
      --user=root \
      --password=${process.env.MYSQL_ROOT_PASSWORD} \
      ${process.env.DB_NAME} > ${filePath}`,
    );
    return filePath;
  } catch (err) {
    err.message = `Error [${err}] creating a backup to the file [${filePath}].`;
    console.error(err);
    throw err;
  }
}

async function updateTransactionsCategory(transactions, category) {
  return queryDatabase(
    queries.queryUpdateTransactionsCategory,
    [category.slice(0, MAX_LEN), transactions],
    (err) => `Error [${err}] updating transactions [${transactions}] to category [${category}].`,
  );
}

async function resetTransactionsCategory(category) {
  return queryDatabase(
    queries.queryResetRowsCategory,
    [category],
    (err) => `Error [${err}] resetting the category of transactions with category [${category}].`,
  );
}

async function resetTransactionsCategoryForAFilter(filterId) {
  return queryDatabase(
    queries.queryResetRowsCategoryForAFilter,
    [filterId],
    (err) => `Error [${err}] resetting the category of transactions with filter ID [${filterId}].`,
  );
}

async function updateTransactionsAsNotDuplicated(transactions) {
  return queryDatabase(
    queries.queryMarkNotDuplicateRows,
    [transactions],
    (err) => `Error [${err}] updating transactions [${transactions}] as not duplicated.`,
  );
}

module.exports = {
  addBank,
  addFilter,
  addTransaction,
  addTransactions,
  applyFilters,
  backupDatabase,
  deleteBank,
  deleteCategory,
  deleteFilter,
  deleteTransactions,
  deleteNewerTransactions,
  executeSql,
  getBankById,
  getBankBalance,
  getBankNames,
  getCategories,
  getCategoryBalance,
  getCategoryFilters,
  getCategoryFiltersBalance,
  getCategoryNonFiltersBalance,
  getTimelineByBank,
  getTimelineByCategory,
  getDuplicatedTransactions,
  getRegisteredBanks,
  getTransactions,
  getYears,
  renameCategory,
  resetTransactionsCategory,
  resetTransactionsCategoryForAFilter,
  sqlStatus,
  updateFilter,
  updateTransactionsAsNotDuplicated,
  updateTransactionsCategory,
};
