const mysql = require("mysql2/promise");
const path = require("path");
const mysqldump = require("mysqldump");
const { execSync } = require("child_process");

const connectionSettings = {
  host: "localhost",
  user: "root",
  password: "secret",
  database: "wmm",
  multipleStatements: true,
};

const queryInsertRow =
  "INSERT INTO transactions (bank, date, description, amount) \
    VALUES (?, ?, ?, ?)";

const queryBankNames = "SELECT DISTINCT bank FROM transactions";

const queryCategoryNames =
  "SELECT DISTINCT category FROM transactions WHERE category != '' ORDER BY category ASC";

const queryUncategorizedTransactions =
  "SELECT id, bank, date, description, category, amount FROM transactions WHERE category = ''";

const queryUncategorizedRowsFilter = " AND description REGEXP ?";

const queryUpdateTransactionsCategory =
  "UPDATE transactions SET category = ? WHERE id IN(?)";

const queryUpdateTransactionsByFilter =
  "UPDATE transactions as t \
    JOIN filters as f \
    SET t.category = f.category \
    WHERE t.description like ? AND f.filter = ?";

const queryAddCategoryFilters =
  "INSERT INTO filters (category, filter) VALUES (?, ?)";

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

const queryMarkNotDuplicateRows =
  "UPDATE transactions SET not_duplicate = TRUE WHERE id IN (?)";

const queryDeleteRows = "DELETE FROM transactions WHERE id IN (?)";

const queryDeleteCategories = "DELETE FROM filters WHERE category IN(?)";

const queryResetRowsCategories =
  "UPDATE transactions SET category = '' WHERE category in (?)";

const queryUpdateRowsCategoryWithAllFilters =
  "UPDATE transactions AS t \
    JOIN filters AS f ON t.description LIKE CONCAT('%',  \
    REPLACE(f.filter, '%', '\\%'), '%') \
    SET t.category = f.category \
    WHERE f.category = ? AND t.category = ''";

const queryRenameRowsCategory =
  "UPDATE transactions SET category = ? WHERE category = ?";

const queryRenameCategoryFilters =
  "UPDATE filters SET category = ? WHERE category = ?";

const queryFilterNames =
  "SELECT DISTINCT filter FROM filters WHERE category=? ORDER BY filter ASC";

const queryDeleteFilters = "DELETE FROM filters WHERE filter IN(?)";

const queryUpdateRowsCategoryWithDescriptionLikeFilter =
  "UPDATE transactions SET category = ? WHERE description LIKE ? AND category = ''";

async function getConnection() {
  return await mysql.createConnection(connectionSettings);
}

async function addFilter(category, filter) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryAddCategoryFilters, [
      category,
      filter,
    ]);
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] adding filter ${filter} to category ${category}.`;
    console.error(error);
    throw error;
  }
}

async function applyFilter(category, filter) {
  try {
    const connection = await getConnection();

    const result = await connection.query(
      queryUpdateRowsCategoryWithDescriptionLikeFilter,
      [category, `%${filter}%`]
    );
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] applying filter [${filter}] from category [${category}].`;
    console.error(error);
    throw error;
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
    const error = `Error [${err}] applying category [${category}].`;
    console.error(error);
    throw error;
  }
}

async function renameCategory(oldName, newName) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryRenameRowsCategory, [
      newName,
      oldName,
    ]);
    await connection.query(queryRenameCategoryFilters, [newName, oldName]);

    connection.close();

    return result;
  } catch (err) {
    const error = `Error [${err}] renaming category [${oldName}] to new name [${newName}].`;
    console.error(error);
    throw error;
  }
}

async function getDuplicatedTransactions() {
  try {
    const connection = await getConnection();
    let query = queryDuplicateRows;
    const result = await connection.query(query);
    connection.close();
    return result.at(0);
  } catch (err) {
    const error = `Error [${err}] retrieving duplicated transactions.`;
    console.error(error);
    throw error;
  }
}

async function getUncategorizedTransactions(filter) {
  try {
    const connection = await getConnection();
    let query = queryUncategorizedTransactions;
    if (filter?.length) {
      query += queryUncategorizedRowsFilter;
    }
    const result = await connection.query(query, [filter]);
    connection.close();
    return result.at(0);
  } catch (err) {
    const error = `Error [${err}] retrieving uncategorized transactions.`;
    console.error(error);
    throw error;
  }
}

async function getCategories() {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryCategoryNames);
    connection.close();
    return result.at(0).map((row) => row.category);
  } catch (err) {
    const error = `Error [${err}] retrieving categories.`;
    console.error(error);
    throw error;
  }
}

async function getCategoryFilters(category) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryFilterNames, [category]);
    connection.close();
    return result.at(0).map((row) => row.filter);
  } catch (err) {
    const error = `Error [${err}] retrieving filters for the category [${category}].`;
    console.error(error);
    throw error;
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
    const error = `Error [${err}] retrieving banks names.`;
    console.error(error);
    throw error;
  }
}

async function addTransaction(date, description, amount, bank) {
  try {
    const connection = await getConnection();

    const result = await connection.query(queryInsertRow, [
      bank,
      date,
      description,
      amount,
    ]);

    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] adding a new transaction with date:[${date}] description:[${description}] amount:[${amount}] bank [${bank}].`;
    console.error(error);
    throw error;
  }
}

async function deleteCategories(categories) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteCategories, [categories]);
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] deleting the following categories [${categories}].`;
    console.error(error);
    throw error;
  }
}

async function deleteFilters(filters) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteFilters, [filters]);
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] deleting the following filters [${filters}].`;
    console.error(error);
    throw error;
  }
}

async function deleteTransactions(transactions) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryDeleteRows, [transactions]);
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] deleting the following transactions [${transactions}].`;
    console.error(error);
    throw error;
  }
}

async function executeSql(query) {
  try {
    const connection = await getConnection();
    const result = await connection.query(query);
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] executing the following query [${categories}].`;
    console.error(error);
    throw error;
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
    const error = `Error [${err}] creating a backup to the file [${filePath}].`;
    console.error(error);
    throw error;
  }
}

async function updateTransactionsCategory(transactions, category) {
  try {
    const connection = await getConnection();
    const result = await connection.query(queryUpdateTransactionsCategory, [
      category,
      transactions,
    ]);
    connection.close();
    return result;
  } catch (err) {
    const error = `Error [${err}] updating the transactions [${transactions}] to the category [${category}].`;
    console.error(error);
    throw error;
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
    const error = `Error [${err}] reseting the category of the transactions that have the following categories [${categories}].`;
    console.error(error);
    throw error;
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
    const error = `Error [${err}] updating the category of transactions whose description matches filter [${filter}].`;
    console.error(error);
    throw error;
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
    const error = `Error [${err}] updating the following transactions as not duplicated [${transactions}].`;
    console.error(error);
    throw error;
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
  getCategories,
  getCategoryFilters,
  getDuplicatedTransactions,
  getUncategorizedTransactions,
  resetTransactionsCategories,
  updateTransactionsCategory,
  updateTransactionsByFilter,
  updateTransactionsAsNotDuplicated,
};
