const express = require('express');
const cors = require('cors');
require('dotenv').config();

const categoriesRouter = require('./filter');
const banksRouter = require('./bank');
const transactionsRouter = require('./transaction');
const sqlRouter = require('./sqlaccess');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors());

categoriesRouter(app);
banksRouter(app);
transactionsRouter(app);
sqlRouter(app);

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
