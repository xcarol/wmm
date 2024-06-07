const mysql = require("mysql2/promise");

const queryInsertRow =
  'INSERT INTO transactions (bank, date, description, amount) \
  VALUES (":bank", ":date", ":description", ":amount")';

const queryBankNames = "SELECT DISTINCT bank FROM transactions";

const queryCategoryNames =
  "SELECT DISTINCT category FROM transactions \
  WHERE (TRIM(category) != '' AND category IS NOT NULL) \
  ORDER BY category ASC";

async function getConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "secret",
    database: "wmm",
  });
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


module.exports = {
  addTransaction,
  executeSql,
  getBankNames,
  getCategories,
};
