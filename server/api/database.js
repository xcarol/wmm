const mysql = require("mysql2/promise");
const path = require("path");
const { execSync } = require("child_process");

const MAX_LEN = 200;

const connectionSettings = {
  host: "localhost",
  user: "root",
  password: "secret",
  database: "wmm",
  multipleStatements: true,
  dateStrings: true,
};

const queryInsertTransactions =
  "INSERT INTO transactions (bank, date, description, amount) VALUES ";

const queryBankNames = "SELECT DISTINCT bank FROM transactions";

const queryCategoryNames =
  "SELECT DISTINCT category FROM transactions WHERE category != '' UNION SELECT DISTINCT category \
    FROM filters ORDER BY category ASC";

const queryCategoryFilters =
  "SELECT id, filter, label FROM filters WHERE category=? ORDER BY filter ASC";

const queryTransactions =
  "SELECT id, bank, date, description, category, amount FROM transactions";

const queryFiltersToApply =
  "SELECT id, category, filter FROM filters ORDER BY filter DESC";

const queryApplyFilter = `
  UPDATE transactions
    SET category = ?, filter_id = ?
    WHERE description LIKE CONCAT('%', REPLACE(?, '%', '\%'), '%') AND category = '';
  `;

const queryUpdateTransactionsCategory =
  "UPDATE transactions SET category = ? WHERE id IN(?)";

const queryBankBalances =
  "SELECT bank, SUM(amount) as balance, MAX(date) AS latest_date, MIN(date) AS first_date \
    FROM transactions WHERE bank = ? AND date >= ? AND date <= ?";

const queryCategoryBalance =
  "WITH category_transactions AS ( \
      SELECT \
        category, \
        YEAR(date) AS year, \
        MONTH(date) AS month, \
        SUM(amount) AS total_amount, \
        COUNT(*) AS transaction_count \
      FROM transactions \
    WHERE category = ? \
      AND date >= ? \
      AND date <= ? \
      GROUP BY category, YEAR(date), MONTH(date) \
    ) \
    SELECT \
      category, \
      SUM(total_amount) AS balance, \
      AVG(total_amount) AS avg_monthly_balance, \
      AVG(transaction_count) AS avg_monthly_transactions \
    FROM category_transactions \
    GROUP BY category";

const queryCategoryFiltersBalance =
  "WITH filter_transactions AS ( \
        SELECT \
          t.category as category, \
          f.filter as filter, \
          f.label as label, \
          YEAR(t.date) AS year, \
          MONTH(t.date) AS month, \
          SUM(t.amount) AS total_amount, \
          COUNT(*) AS transaction_count \
        FROM transactions t\
        JOIN filters f ON t.filter_id = f.id \
      WHERE t.category = ? \
        AND f.filter = ? \
        AND t.date >= ? \
        AND t.date <= ? \
        GROUP BY t.category, YEAR(t.date), MONTH(t.date) \
      ) \
      SELECT \
        category, filter, label, \
        SUM(total_amount) AS balance, \
        AVG(total_amount) AS avg_monthly_balance, \
        AVG(transaction_count) AS avg_monthly_transactions \
      FROM filter_transactions \
      GROUP BY category";

const queryBalancesWithoutCategoryStart =
  "SELECT description AS category, \
    amount AS balance, \
    amount AS avg_monthly_balance, \
    amount AS avg_monthly_transactions \
  FROM transactions WHERE category = ? ";

const queryBalancesWithoutCategoryDescription = "AND description NOT LIKE ? ";
const queryBalancesWithoutCategoryEnd = "AND date >= ? AND date <= ?";

const queryDuplicateRows =
  "SELECT id, bank, date, description, category, amount FROM transactions t1 \
    WHERE EXISTS ( \
        SELECT 1 \
        FROM transactions t2 \
        WHERE t1.bank = t2.bank \
        AND t1.date = t2.date \
        AND t1.description = t2.description \
        AND t1.amount = t2.amount \
        AND t1.id <> t2.id \
        AND t1.not_duplicate = FALSE \
        AND t2.not_duplicate = FALSE \
    ) \
    ORDER BY bank, date DESC";

const queryDeleteRows = "DELETE FROM transactions WHERE id IN (?)";

const queryDeleteRowsNewerThanDate =
  "DELETE FROM transactions WHERE bank = ? AND date >= ?";

const queryMarkNotDuplicateRows =
  "UPDATE transactions SET not_duplicate = TRUE WHERE id IN (?)";

const queryYears = "SELECT DISTINCT YEAR(date) as year FROM transactions";

const queryAddCategoryFilter =
  "INSERT INTO filters (category, filter, label) VALUES (?, ?, ?)";

const queryDeleteCategory = "DELETE FROM filters WHERE category = ?";

const queryDeleteFilter = "DELETE FROM filters WHERE id = ?";

const queryResetRowsCategory =
  "UPDATE transactions SET category = '', filter_id = NULL WHERE category = ?";

const queryResetRowsCategoryForAFilter =
  "UPDATE transactions SET category = '', filter_id = NULL WHERE filter_id = ?";

const queryRenameRowsCategory =
  "UPDATE transactions SET category = ? WHERE category = ?";

const queryRenameCategoryFilters =
  "UPDATE filters SET category = ? WHERE category = ?";

const queryUpdateFilter =
  "UPDATE filters SET filter = ?, label = ? WHERE id = ?";

async function getConnection() {
  return await mysql.createConnection(connectionSettings);
}

async function applyFilters() {
  let connection;

  try {
    connection = await getConnection();
    const operations = [];
    const [filters] = await connection.query(queryFiltersToApply);

    for (let index = 0; index < filters.length; index++) {
      const filter = filters[index];
      operations.push(
        connection.query(queryApplyFilter, [
          filter.category,
          filter.id,
          filter.filter,
        ])
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

async function addFilter(category, filter, label) {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.query(queryAddCategoryFilter, [
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

    const result = await connection.query(queryUpdateFilter, [
      filter.slice(0, MAX_LEN),
      label.slice(0, MAX_LEN),
      id,
    ]);

    return result;
  } catch (err) {
    err.message = `Error [${err}] updating filter ${filter} with label ${label} to category ${category}.`;
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

    const result = await connection.query(queryRenameRowsCategory, [
      newName.slice(0, MAX_LEN),
      oldName,
    ]);
    await connection.query(queryRenameCategoryFilters, [newName, oldName]);

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

async function getTransactions(bankName, startDate, endDate, category, filter) {
  let connection;

  try {
    connection = await getConnection();
    let query = queryTransactions;
    const params = [];

    if (bankName || startDate || endDate || typeof category === "string" || filter) {
      let useAnd = false;
      query += " WHERE ";

      if (bankName) {
        query += " bank = ? ";
        params.push(bankName);
        useAnd = true;
      }

      if (startDate) {
        if (useAnd) {
          query += " AND ";
        }
        query += " date >= ? ";
        params.push(startDate);
        useAnd = true;
      }

      if (endDate) {
        if (useAnd) {
          query += " AND ";
        }
        query += " date <= ? ";
        params.push(endDate);
        useAnd = true;
      }

      if (typeof category === "string") {
        if (useAnd) {
          query += " AND ";
        }
        query += " category = ? ";
        params.push(category);
        useAnd = true;
      }

      if (filter) {
        if (useAnd) {
          query += " AND ";
        }
        query += " description LIKE ? ";
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
    const result = await connection.query(queryDuplicateRows);
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
    const result = await connection.query(queryYears);
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
    const result = await connection.query(queryBankBalances, [
      bank,
      start,
      end,
    ]);
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
    const result = await connection.query(queryCategoryNames);
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
    const result = await connection.query(queryCategoryBalance, [
      category,
      start,
      end,
    ]);
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
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
    const result = await connection.query(queryCategoryFiltersBalance, [
      category,
      filter,
      start,
      end,
    ]);
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
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
    const filterNamesResult = await connection.query(queryCategoryFilters, [
      category,
    ]);
    const filterNames = filterNamesResult.at(0);

    const queryBalancesWithoutCategory =
      queryBalancesWithoutCategoryStart.concat(
        queryBalancesWithoutCategoryDescription.repeat(filterNames.length),
        queryBalancesWithoutCategoryEnd
      );

    const parameters = [];
    parameters.push(category);
    filterNames.forEach((filter) => {
      parameters.push(`%${filter.filter}%`);
    });
    parameters.push(start);
    parameters.push(end);

    const result = await connection.query(
      queryBalancesWithoutCategory,
      parameters
    );

    balances.push(result.at(0));

    return balances;
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
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
    const result = await connection.query(queryCategoryFilters, [category]);
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
    const query = queryBankNames;
    const result = await connection.query(query);
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

async function addTransactions(transactions) {
  let connection;

  try {
    connection = await getConnection();
    let query = queryInsertTransactions;
    const parameters = [];

    transactions.forEach((transaction) => {
      query += " (?, ?, ?, ?),";
      parameters.push(
        transaction.bank,
        transaction.date,
        transaction.description,
        transaction.amount
      );
    });
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
    const result = await connection.query(queryDeleteCategory, [category]);
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
    const result = await connection.query(queryDeleteFilter, [filterId]);
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
    const result = await connection.query(queryDeleteRows, [transactions]);
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
    const result = await connection.query(queryDeleteRowsNewerThanDate, [
      bank,
      date,
    ]);
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
  try {
    const filePath = path.join(__dirname, "wmm.sql");

    execSync(
      `/usr/bin/mysqldump --host=127.0.0.1 --user=root --password=secret wmm > ${filePath}`
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
    const result = await connection.query(queryUpdateTransactionsCategory, [
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
    const result = await connection.query(queryResetRowsCategory, [category]);
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
    const result = await connection.query(queryResetRowsCategoryForAFilter, [
      filterId,
    ]);
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
    const result = await connection.query(queryMarkNotDuplicateRows, [
      transactions,
    ]);
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
  addFilter,
  addTransactions,
  applyFilters,
  backupDatabase,
  deleteCategory,
  deleteFilter,
  deleteTransactions,
  deleteNewerTransactions,
  executeSql,
  getBankBalance,
  getBankNames,
  getCategories,
  getCategoryBalance,
  getCategoryFilters,
  getCategoryFiltersBalance,
  getCategoryNonFiltersBalance,
  getDuplicatedTransactions,
  getTransactions,
  getYears,
  renameCategory,
  resetTransactionsCategory,
  resetTransactionsCategoryForAFilter,
  updateFilter,
  updateTransactionsAsNotDuplicated,
  updateTransactionsCategory,
};
