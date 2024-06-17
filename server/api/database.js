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
    console.error("Error adding filter:", err);
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
    const result = await connection.query(query, [filter]);
    connection.close();
    return result.at(0);
  } catch (err) {
    console.error("Error fetching categories:", err);
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
    console.error("Error fetching categories:", err);
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
    console.error("Error fetching bank names:", err);
    throw err;
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
    console.error("Error fetching bank names:", err);
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
    console.error("Error executing query:", err);
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
    console.error("Error at backup database:", err);
    throw err;
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
    console.error("Error executing query:", err);
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
    console.error("Error executing query:", err);
    throw err;
  }
}

module.exports = {
  addTransaction,
  addFilter,
  backupDatabase,
  executeSql,
  getBankNames,
  getCategories,
  getUncategorizedTransactions,
  updateTransactionsCategory,
  updateTransactionsByFilter,
};
