const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "your_user",
  password: "your_password",
  database: "your_database",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

const getAllCategories = () => {
  return new Promise((resolve, reject) => {
    const query = "SELECT * FROM categories";
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
