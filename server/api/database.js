const mysql = require("mysql2/promise");

async function getConnection() {
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "secret",
    database: "wmm",
  });
}

async function getAllCategories() {
  try {
    const connection = await getConnection();
    const query = "SELECT DISTINCT(category) FROM filters";
    const result = await connection.query(query);
    return result.map((row) => row.category_name);
  } catch (err) {
    console.error("Error fetching categories:", err);
    throw err; // Re-throw the error for handling in the caller
  }
}

module.exports = {
  getAllCategories,
};
