const express = require("express");
const cors = require("cors");
const categoriesRouter = require("./categories");
const banknamesRouter = require("./banknames");
const transactionsRouter = require("./transactions");
const sqlRouter = require("./sqlaccess");

const app = express();
app.use(express.json());
app.use(cors());

categoriesRouter(app);
banknamesRouter(app);
transactionsRouter(app);
sqlRouter(app);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
