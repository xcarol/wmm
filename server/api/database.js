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
  'INSERT INTO transactions (bank, date, description, amount) \
  VALUES (":bank", ":date", ":description", ":amount")';

const queryBankNames = "SELECT DISTINCT bank FROM transactions";

const queryCategoryNames =
  "SELECT DISTINCT category FROM transactions \
  WHERE category != '' ORDER BY category ASC";

const queryUncategorizedTransactions =
  "SELECT id, bank, date, description, category, amount FROM transactions WHERE category = ''";

const queryUncategorizedRowsFilter = " AND description REGEXP ':filter'";

const queryUpdateTransactionsCategory =
  "UPDATE transactions SET category = '%1' WHERE id IN(%2)";

async function getConnection() {
  return await mysql.createConnection(connectionSettings);
}

async function getUncategorizedTransactions(filter) {
  try {
    const connection = await getConnection();
    let query = queryUncategorizedTransactions;
    if (filter?.length) {
      query += queryUncategorizedRowsFilter.replace(":filter", filter);
    }
    const result = await connection.query(query);
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

    const result = await connection.query(
      queryInsertRow
        .replace(":date", date)
        .replace(":description", description)
        .replace(":amount", amount)
        .replace(":bank", bank)
    );
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
    const result = await connection.query(
      queryUpdateTransactionsCategory
        .replace("%1", category)
        .replace("%2", transactions.toString())
    );
    connection.close();
    return result;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  }
}

module.exports = {
  addTransaction,
  backupDatabase,
  executeSql,
  getBankNames,
  getCategories,
  getUncategorizedTransactions,
  updateTransactionsCategory,
};
