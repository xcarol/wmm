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

const queryFilterNames =
  "SELECT DISTINCT filter FROM filters WHERE category=? ORDER BY filter ASC";

const queryUncategorizedTransactions =
  "SELECT id, bank, date, description, category, amount FROM transactions WHERE category = ''";

const queryBankTransactions =
  "SELECT id, bank, date, description, category, amount FROM transactions WHERE bank = ?";

const queryUncategorizedRowsFilter = " AND description LIKE ?";

const queryUpdateRowsCategoryWithAllFilters =
  "UPDATE transactions AS t \
    JOIN filters AS f ON t.description LIKE CONCAT('%',  \
    REPLACE(f.filter, '%', '\\%'), '%') \
    SET t.category = f.category \
    WHERE f.category = ? AND t.category = ''";

const queryUpdateRowsCategoryWithDescriptionLikeFilter =
  "UPDATE transactions SET category = ? WHERE description LIKE ? AND category = ''";

const queryUpdateTransactionsCategory =
  "UPDATE transactions SET category = ? WHERE id IN(?)";

const queryBankBalances =
  "SELECT bank, SUM(amount) as balance, MAX(date) AS latest_date from \
    transactions WHERE bank = ? AND date >= ? AND date <= ?";

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

const queryAddCategoryFilters =
  "INSERT INTO filters (category, filter) VALUES (?, ?)";

const queryDeleteCategories = "DELETE FROM filters WHERE category IN (?)";

const queryDeleteFilters = "DELETE FROM filters WHERE filter IN(?)";

const queryResetRowsCategories =
  "UPDATE transactions SET category = '' WHERE category IN (?)";

const queryRenameRowsCategory =
  "UPDATE transactions SET category = ? WHERE category = ?";

const queryUpdateTransactionsByFilter =
  "UPDATE transactions as t \
    JOIN filters as f \
    SET t.category = f.category \
    WHERE t.description LIKE ? AND f.filter = ?";

const queryRenameCategoryFilters =
  "UPDATE filters SET category = ? WHERE category = ?";

async function getConnection() {
  return await mysql.createConnection(connectionSettings);
}

async function addFilter(category, filter) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryAddCategoryFilters, [
      category.slice(0, MAX_LEN),
      filter.slice(0, MAX_LEN),
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] adding filter ${filter} to category ${category}.`;
    console.error(err);
    throw err;
  }
}

async function applyFilter(category, filter) {
  try {
    const connection = await getConnection();

    const result = await connection.query(
      queryUpdateRowsCategoryWithDescriptionLikeFilter,
      [category.slice(0, MAX_LEN), `%${filter}%`]
    );
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] applying filter [${filter}] from category [${category}].`;
    console.error(err);
    throw err;
  }
}

async function applyCategory(category) {
  try {
    const connection = await getConnection();

    const result = await connection.query(
      queryUpdateRowsCategoryWithAllFilters,
      category
    );
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] applying category [${category}].`;
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

async function getBankTransactions(bankName) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryBankTransactions, bankName);
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
    const filterNamesResult = await connection.query(queryFilterNames, [
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
    const result = await connection.query(queryFilterNames, [category]);
    connection.close();
    return result.at(0).map((row) => row.filter);
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

async function deleteCategories(categories) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteCategories, [categories]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the following categories [${categories}].`;
    console.error(err);
    throw err;
  }
}

async function deleteFilters(filters) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteFilters, [filters]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] deleting the following filters [${filters}].`;
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

async function resetTransactionsCategories(categories) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryResetRowsCategories, [
      categories,
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] reseting the category of the transactions that have the following categories [${categories}].`;
    console.error(err);
    throw err;
  }
}

async function updateTransactionsByFilter(filter) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryUpdateTransactionsByFilter, [
      `%${filter}%`,
      filter,
    ]);
    connection.close();
    return result;
  } catch (err) {
    err.message = `Error [${err}] updating the category of transactions whose description matches filter [${filter}].`;
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
  applyFilter,
  applyCategory,
  renameCategory,
  backupDatabase,
  deleteCategories,
  deleteFilters,
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
  resetTransactionsCategories,
  updateTransactionsCategory,
  updateTransactionsByFilter,
  updateTransactionsAsNotDuplicated,
};
