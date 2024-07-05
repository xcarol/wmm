const {
  addTransaction,
  applyCategory,
  deleteTransactions,
  getBankTransactions,
  getDuplicatedTransactions,
  getUncategorizedTransactions,
  getYears,
  resetTransactionsCategories,
  updateTransactionsCategory,
  updateTransactionsByFilter,
  updateTransactionsAsNotDuplicated,
} = require("./database");

module.exports = (app) => {
  app.post("/transactions", async (req, res) => {
    let date,
      description,
      amount,
      bank = "";

    try {
      date = req.body.date;
      description = req.body.description;
      amount = req.body.amount;
      bank = req.body.bank;

      res.json(await addTransaction(date, description, amount, bank));
      res.status(201);
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put("/transactions", async (req, res) => {
    let transactions;

    try {
      transactions = req.body.transactions;
      res.json(await deleteTransactions(transactions));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put("/transactions/category", async (req, res) => {
    try {
      const data = req.body;
      const operation = data.operation;
      switch (operation) {
        case "apply":
          res.json(await updateTransactionsCategory(data.transactions, data.category));
          break;
        case "categorize":
          res.json(await applyCategory(data.category));
          break;
        case "reset":
          res.json(await resetTransactionsCategories(data.categories));
          break;
        default:
          throw `Error [unknow operation: ${operation}] updating transactions category.`;
      }
    } catch (err) {
      console.error(err);
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put("/transactions/filter", async (req, res) => {
    let filter;

    try {
      filter = req.body.filter;
      res.json(await updateTransactionsByFilter(filter));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get("/transactions/uncategorized", async (req, res) => {
    let filter;

    try {
      filter = req.query.filter;
      res.json(await getUncategorizedTransactions(filter));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get("/transactions/duplicated", async (req, res) => {
    try {
      res.json(await getDuplicatedTransactions());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put("/transactions/duplicated", async (req, res) => {
    let transactions;

    try {
      transactions = req.body.transactions;
      res.json(await updateTransactionsAsNotDuplicated(transactions));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get("/transactions", async (req, res) => {
    let bank;

    try {
      bank = req.query.bank;
      res.json(await getBankTransactions(bank));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get("/transactions/years", async (req, res) => {
    try {
      res.json(await getYears());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
