const mysql = require("mysql2/promise");

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
    const query = "SELECT DISTINCT(category) FROM filters";
    const result = await connection.query(query);
    return result.at(0).map((row) => row.category);
  } catch (err) {
    console.error("Error fetching categories:", err);
    throw err;
  }
}

async function getBankNames() {
  try {
    const connection = await getConnection();
    const query = "SELECT DISTINCT(bank) FROM transactions";
    const result = await connection.query(query);
    return result.at(0).map((row) => row.bank);
  } catch (err) {
    console.error("Error fetching bank names:", err);
    throw err;
  }
}

module.exports = {
  getCategories,
  getBankNames
};
