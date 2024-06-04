const express = require("express");
const cors = require("cors");
const categoriesRouter = require("./categories");
const banknamesRouter = require("./bank-names");

const app = express();
app.use(cors());

categoriesRouter(app);
banknamesRouter(app);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
