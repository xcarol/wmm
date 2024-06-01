const mysql = require("mysql2/promise");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "secret",
  database: "wmm",
});

const getAllCategories = () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT DISTINCT(category) FROM filters";
    connection.query(query, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result.map((row) => row.category_name));
    });
  });
};

module.exports = {
  connection,
  getAllCategories,
};
