const express = require("express");
const cors = require("cors");
const categoriesRouter = require("./categories");

const app = express();
app.use(cors());

categoriesRouter(app);

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
