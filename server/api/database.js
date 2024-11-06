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

async function applyFilters() {
  let connection;

  try {
    connection = await getConnection();
    const operations = [];
    const [filters] = await connection.query(queries.queryFiltersToApply);

    for (let index = 0; index < filters.length; index++) {
      const filter = filters[index];
      operations.push(
        connection.query(queries.queryApplyFilter, [filter.category, filter.id, filter.filter]),
      );
    }

    const results = await Promise.all(operations);
    let affectedRows = 0;
    for (let index = 0; index < results.length; index++) {
      const [result] = results[index];
      affectedRows += result.affectedRows;
    }

    return affectedRows;
  } catch (err) {
    err.message = `Error [${err}] applying filters.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function addBank(institution_name, institution_id, requisition_id, accessDays) {
  let connection;

  try {
    connection = await getConnection();

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
    const result = await connection.query(queries.queryAddBank, [
      institution_name,
      institution_id,
      requisition_id,
      dateAccessDays,
    ]);

    return result;
  } catch (err) {
    err.message = `Error [${err}] adding bank ${institution_id} with requisition_id ${requisition_id}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function deleteBank(bank_id) {
  let connection;

  try {
    connection = await getConnection();

    return connection.query(queries.queryDeleteBank, [bank_id]);
  } catch (err) {
    err.message = `Error [${err}] deleting bank with institution_id ${bank_id}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getBankById(bank_id) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryBankById, [bank_id]);
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] searching bank with institution_id ${bank_id}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getBankLatestDate(bank_name) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.query(queries.queryBankLastestTransactionDate, [bank_name]);
    if (result.at(0).length) {
      return result.at(0).at(0);
    }
    return {};
  } catch (err) {
    err.message = `Error [${err}] searching for latest transaction of bank: ${bank_name}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function addFilter(category, filter, label) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.query(queries.queryAddCategoryFilter, [
      category.slice(0, MAX_LEN),
      filter.slice(0, MAX_LEN),
      label.slice(0, MAX_LEN),
    ]);

    return result;
  } catch (err) {
    err.message = `Error [${err}] adding filter ${filter} with label ${label} to category ${category}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function updateFilter(id, filter, label) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.query(queries.queryUpdateFilter, [
      filter.slice(0, MAX_LEN),
      label.slice(0, MAX_LEN),
      id,
    ]);

    return result;
  } catch (err) {
    err.message = `Error [${err}] updating filter ${filter} with label ${label}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function renameCategory(oldName, newName) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.query(queries.queryRenameRowsCategory, [
      newName.slice(0, MAX_LEN),
      oldName,
    ]);
    await connection.query(queries.queryRenameCategoryFilters, [newName, oldName]);

    return result;
  } catch (err) {
    err.message = `Error [${err}] renaming category [${oldName}] to new name [${newName}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getRegisteredBanks() {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryRegisteredBanks);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving registered banks.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getTransactions(bankName, startDate, endDate, category, filter) {
  let connection;

  try {
    connection = await getConnection();
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

    const result = await connection.query(query, params);

    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving transactions.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getDuplicatedTransactions() {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryDuplicateRows);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving duplicated transactions.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getYears() {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryYears);
    return result.at(0).map((row) => row.year);
  } catch (err) {
    err.message = `Error [${err}] retrieving years from transactions.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getBankBalance(bank, start, end) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryBankBalances, [bank, start, end]);
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving bank balance.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getCategories() {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryCategoryNames);
    return result.at(0).map((row) => row.category);
  } catch (err) {
    err.message = `Error [${err}] retrieving categories.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getCategoryBalance(category, start, end) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryCategoryBalance, [category, start, end]);
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving balance of ctaegories.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getCategoryFiltersBalance(category, filter, start, end) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryCategoryFiltersBalance, [
      category,
      filter,
      start,
      end,
    ]);
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving balance of categories by filter.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getCategoryNonFiltersBalance(category, start, end) {
  let connection;

  try {
    const balances = [];
    connection = await getConnection();
    const filterNamesResult = await connection.query(queries.queryCategoryFilters, [category]);
    const filterNames = filterNamesResult.at(0);

    const queryBalancesWithoutCategory = queries.queryBalancesWithoutCategoryStart.concat(
      queries.queryBalancesWithoutCategoryDescription.repeat(filterNames.length),
      queries.queryBalancesWithoutCategoryEnd,
    );

    const parameters = [];
    parameters.push(category);
    filterNames.forEach((filter) => {
      parameters.push(`%${filter.filter}%`);
    });
    parameters.push(start);
    parameters.push(end);

    const result = await connection.query(queryBalancesWithoutCategory, parameters);

    balances.push(result.at(0));

    return balances;
  } catch (err) {
    err.message = `Error [${err}] retrieving balance of categories without a filter.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getTimelineByBank(bank, period, start, end) {
  let connection;
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
  try {
    connection = await getConnection();
    const result = await connection.query(query, [bank, start, end]);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving the bank timeline for period [${period}] start [${start}] end [${end}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getTimelineByCategory(category, period, start, end) {
  let connection;
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
  try {
    connection = await getConnection();
    const result = await connection.query(query, [category, start, end]);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving the category [${category}] timeline for period [${period}] start [${start}] end [${end}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getCategoryFilters(category) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryCategoryFilters, [category]);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving filters for the category [${category}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function getBankNames() {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryBankNames);
    return result.at(0).map((row) => row.bank);
  } catch (err) {
    err.message = `Error [${err}] retrieving banks names.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function addTransaction(date, bank, category, description, amount) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryAddTransaction, [
      date,
      bank,
      category,
      description,
      amount,
    ]);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] adding a transaction with date: ${date}, bank: ${bank}, category: ${category}, description: ${description}, amount: ${amount}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function addTransactions(transactions) {
  let connection;

  try {
    connection = await getConnection();
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

    const result = await connection.query(query, parameters);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] adding new transactions:[${transactions}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function deleteCategory(category) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryDeleteCategory, [category]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the following category [${category}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function deleteFilter(filterId) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryDeleteFilter, [filterId]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the filter with id [${filterId}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function deleteTransactions(transactions) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryDeleteRows, [transactions]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the following transactions [${transactions}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function deleteNewerTransactions(bank, date) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryDeleteRowsNewerThanDate, [bank, date]);
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] deleting transactions newer than ${date}.`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function executeSql(query) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(query);
    return result;
  } catch (err) {
    err.message = `Error [${err}] executing the following query [${query}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
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
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryUpdateTransactionsCategory, [
      category.slice(0, MAX_LEN),
      transactions,
    ]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] updating the transactions [${transactions}] to the category [${category}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function resetTransactionsCategory(category) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryResetRowsCategory, [category]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] reseting the category of the transactions that have the following categories [${category}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function resetTransactionsCategoryForAFilter(filterId) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryResetRowsCategoryForAFilter, [filterId]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] reseting the category of the transactions with filterId [${filterId}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
}

async function updateTransactionsAsNotDuplicated(transactions) {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.query(queries.queryMarkNotDuplicateRows, [transactions]);
    return result;
  } catch (err) {
    err.message = `Error [${err}] updating the following transactions as not duplicated [${transactions}].`;
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      connection.close();
    }
  }
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
  getBankLatestDate,
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
