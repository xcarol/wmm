const express = require("express");
const categoriesRouter = require("./categories");
const { connection, getAllCategories } = require("./database");

const app = express();

app.get("/categories", async (req, res) => {
  const categories = await getAllCategories();
  res.json(categories);
});

categoriesRouter(app, connection);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
