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

const queryInsertRow =
  "INSERT INTO transactions (bank, date, description, amount) \
    VALUES (?, ?, ?, ?)";

const queryBankNames = "SELECT DISTINCT bank FROM transactions";

const queryCategoryNames =
  "SELECT DISTINCT category FROM transactions WHERE category != '' UNION SELECT DISTINCT category \
    FROM filters ORDER BY category ASC";

const queryFilter = "SELECT category, filter, label FROM filters WHERE id = ?";

const queryCategoryFilters =
  "SELECT id, filter, label FROM filters WHERE category=? ORDER BY filter ASC";

const queryUncategorizedTransactions =
  "SELECT id, bank, date, description, category, amount FROM transactions WHERE category = ''";

const queryBankTransactions =
  "SELECT id, bank, date, description, category, amount \
      FROM transactions";

const queryUncategorizedRowsFilter = " AND description LIKE ?";

const queryUpdateRowsCategoryWithAllFilters =
  "UPDATE transactions AS t \
    JOIN filters AS f ON t.description LIKE CONCAT('%',  \
    REPLACE(f.filter, '%', '\\%'), '%') \
    SET t.category = f.category \
    WHERE f.category = ? AND t.category = ''";

const queryUpdateTransactionsByFilter =
  "UPDATE transactions SET category = ?, filter_id = ? WHERE description LIKE ? AND category = ''";

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
          category, \
          YEAR(date) AS year, \
          MONTH(date) AS month, \
          SUM(amount) AS total_amount, \
          COUNT(*) AS transaction_count \
        FROM transactions \
      WHERE category = ? \
        AND description LIKE ? \
        AND date >= ? \
        AND date <= ? \
        GROUP BY category, YEAR(date), MONTH(date) \
      ) \
      SELECT \
        ? as category, \
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
  "UPDATE filters SET filter = ?, label = ? WHERE category = ? AND filter = ?";

async function getConnection() {
  return await mysql.createConnection(connectionSettings);
}

async function addFilter(category, filter, label) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryAddCategoryFilter, [
      category.slice(0, MAX_LEN),
      filter.slice(0, MAX_LEN),
      label.slice(0, MAX_LEN),
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] adding filter ${filter} with label ${label} to category ${category}.`;
    console.error(err);
    throw err;
  }
}

async function updateFilter(category, filter, label) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryUpdateFilter, [
      filter.slice(0, MAX_LEN),
      label.slice(0, MAX_LEN),
      category.slice(0, MAX_LEN),
      filter.slice(0, MAX_LEN),
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] updating filter ${filter} with label ${label} to category ${category}.`;
    console.error(err);
    throw err;
  }
}

async function renameCategory(oldName, newName) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryRenameRowsCategory, [
      newName.slice(0, MAX_LEN),
      oldName,
    ]);
    await connection.query(queryRenameCategoryFilters, [newName, oldName]);

    connection.close();

    return result;
  } catch (err) {
    err.message = `Error [${err}] renaming category [${oldName}] to new name [${newName}].`;
    console.error(err);
    throw err;
  }
}

async function getBankTransactions(
  bankName,
  startDate,
  endDate,
  category,
  filter
) {
  try {
    const connection = await getConnection();
    let query = queryBankTransactions;
    const params = [];

    if (bankName || startDate || endDate || category || filter) {
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

      if (category) {
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

    connection.close();
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving transactions.`;
    console.error(err);
    throw err;
  }
}

async function getDuplicatedTransactions() {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDuplicateRows);
    connection.close();
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving duplicated transactions.`;
    console.error(err);
    throw err;
  }
}

async function getUncategorizedTransactions(filter) {
  try {
    const connection = await getConnection();
    let query = queryUncategorizedTransactions;
    if (filter?.length) {
      query += queryUncategorizedRowsFilter;
    }
    const result = await connection.query(query, `%${filter}%`);
    connection.close();
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving uncategorized transactions.`;
    console.error(err);
    throw err;
  }
}

async function getYears() {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryYears);
    connection.close();
    return result.at(0).map((row) => row.year);
  } catch (err) {
    err.message = `Error [${err}] retrieving years from transactions.`;
    console.error(err);
    throw err;
  }
}

async function getBankBalance(bank, start, end) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryBankBalances, [
      bank,
      start,
      end,
    ]);
    connection.close();
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving bank balance.`;
    console.error(err);
    throw err;
  }
}

async function getCategories() {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryCategoryNames);
    connection.close();
    return result.at(0).map((row) => row.category);
  } catch (err) {
    err.message = `Error [${err}] retrieving categories.`;
    console.error(err);
    throw err;
  }
}

async function getCategoryBalance(category, start, end) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryCategoryBalance, [
      category,
      start,
      end,
    ]);
    connection.close();
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
    console.error(err);
    throw err;
  }
}

async function getCategoryFilter(filterId) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryFilter, [filterId]);
    connection.close();
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
    console.error(err);
    throw err;
  }
}

async function getCategoryFiltersBalance(category, filter, start, end) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryCategoryFiltersBalance, [
      category,
      `%${filter}%`,
      start,
      end,
      filter,
    ]);
    connection.close();
    return result.at(0).at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
    console.error(err);
    throw err;
  }
}

async function getCategoryNonFiltersBalance(category, start, end) {
  try {
    const balances = [];
    const connection = await getConnection();
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

    connection.close();
    return balances;
  } catch (err) {
    err.message = `Error [${err}] retrieving category balance.`;
    console.error(err);
    throw err;
  }
}

async function getCategoryFilters(category) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryCategoryFilters, [category]);
    connection.close();
    return result.at(0);
  } catch (err) {
    err.message = `Error [${err}] retrieving filters for the category [${category}].`;
    console.error(err);
    throw err;
  }
}

async function getBankNames() {
  try {
    const connection = await getConnection();
    const query = queryBankNames;
    const result = await connection.query(query);
    connection.close();
    return result.at(0).map((row) => row.bank);
  } catch (err) {
    err.message = `Error [${err}] retrieving banks names.`;
    console.error(err);
    throw err;
  }
}

async function addTransaction(date, description, amount, bank) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryInsertRow, [
      bank.slice(0, MAX_LEN),
      date,
      description.slice(0, MAX_LEN),
      amount,
    ]);

    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] adding a new transaction with date:[${date}] description:[${description}] amount:[${amount}] bank [${bank}].`;
    console.error(err);
    throw err;
  }
}

async function deleteCategory(category) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteCategory, [category]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the following category [${category}].`;
    console.error(err);
    throw err;
  }
}

async function deleteFilter(filterId) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteFilter, [filterId]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the filter with id [${filterId}].`;
    console.error(err);
    throw err;
  }
}

async function deleteTransactions(transactions) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteRows, [transactions]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the following transactions [${transactions}].`;
    console.error(err);
    throw err;
  }
}

async function executeSql(query) {
  try {
    const connection = await getConnection();
    const result = await connection.query(query);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] executing the following query [${query}].`;
    console.error(err);
    throw err;
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
  try {
    const connection = await getConnection();
    const result = await connection.query(queryUpdateTransactionsCategory, [
      category.slice(0, MAX_LEN),
      transactions,
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] updating the transactions [${transactions}] to the category [${category}].`;
    console.error(err);
    throw err;
  }
}

async function resetTransactionsCategory(category) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryResetRowsCategory, [category]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] reseting the category of the transactions that have the following categories [${category}].`;
    console.error(err);
    throw err;
  }
}

async function resetTransactionsCategoryForAFilter(filterId) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryResetRowsCategoryForAFilter, [
      filterId,
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] reseting the category of the transactions with filterId [${filterId}].`;
    console.error(err);
    throw err;
  }
}

async function updateTransactionsAsNotDuplicated(transactions) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryMarkNotDuplicateRows, [
      transactions,
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] updating the following transactions as not duplicated [${transactions}].`;
    console.error(err);
    throw err;
  }
}

module.exports = {
  addTransaction,
  addFilter,
  updateFilter,
  renameCategory,
  backupDatabase,
  deleteCategory,
  deleteFilter,
  deleteTransactions,
  executeSql,
  getBankNames,
  getBankBalance,
  getCategories,
  getCategoryBalance,
  getCategoryFilters,
  getCategoryFiltersBalance,
  getCategoryNonFiltersBalance,
  getBankTransactions,
  getDuplicatedTransactions,
  getUncategorizedTransactions,
  getYears,
  resetTransactionsCategory,
  resetTransactionsCategoryForAFilter,
  updateTransactionsCategory,
  updateTransactionsAsNotDuplicated,
};
