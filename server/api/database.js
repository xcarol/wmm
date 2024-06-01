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
    return result.at(0).map((row) => row.category);
  } catch (err) {
    console.error("Error fetching categories:", err);
    throw err;
  }
}

module.exports = {
  getAllCategories,
};
