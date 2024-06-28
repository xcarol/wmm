const {
  addTransaction,
  deleteTransactions,
  getDuplicatedTransactions,
  getUncategorizedTransactions,
  resetTransactionsCategories,
  updateTransactionsCategory,
  updateTransactionsByFilter,
  updateTransactionsAsNotDuplicated,
} = require("./database");

module.exports = (app) => {
  app.put("/transaction", async (req, res) => {
    let date, description, amount, bank = '';

    try {
      date = req.body.data.date;
      description = req.body.data.description;
      amount = req.body.data.amount;
      bank = req.body.data.bank;

      res.json(
        await addTransaction(
          date,
          description,
          amount,
          bank
        )
      );
      res.status(201);
    } catch (err) {
      const error = `Error [${err}] adding transaction with date:[${date}] description:[${description}] amount:[${amount}] bank:[${bank}].`;
      console.error(error);
      res.status(err.sqlState ? 400 : 500).send(error);
    }
  });

  app.post("/transaction/delete", async (req, res) => {
    let transactions;

    try {
      transactions = req.body.data.transactions;
      res.json(await deleteTransactions(transactions));
    } catch (err) {
      const error = `Error [${err}] deleting transactions [${transactions}].`;
      console.error(error);
      res.status(err.sqlState ? 400 : 500).send(error);
    }
  });

  app.post("/transaction/category", async (req, res) => {
    let category, transactions;

    try {
      category = req.body.data.category;
      transactions = req.body.data.transactions;
      res.json(
        await updateTransactionsCategory(transactions, category)
      );
    } catch (err) {
      const error = `Error [${err}] updating transactions [${transactions}] with category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/transaction/category/reset", async (req, res) => {
    let categories;

    try {
      categories = req.body.data.categories;
      res.json(await resetTransactionsCategories(categories));
    } catch (err) {
      const error = `Error [${err}] reseting transactions with categories [${categories}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/transaction/filter", async (req, res) => {
    let filter;

    try {
      filter = req.body.data.filter;
      res.json(await updateTransactionsByFilter(filter));
    } catch (err) {
      const error = `Error [${err}] updating transactions that match filter [${filter}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.get("/transaction/uncategorized", async (req, res) => {
    let filter;

    try {
      filter = req.query.data.filter;
      res.json(await getUncategorizedTransactions(filter));
    } catch (err) {
      const error = `Error [${err}] retrieving uncategorized transactions that match filter [${filter}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.get("/transaction/duplicated", async (req, res) => {
    try {
      res.json(await getDuplicatedTransactions());
    } catch (err) {
      const error = `Error [${err}] retrieving duplicated transactions.`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/transaction/duplicated", async (req, res) => {
    let transactions;

    try {
      transactions = req.body.data.transactions;
      res.json(await updateTransactionsAsNotDuplicated(transactions));
    } catch (err) {
      const error = `Error [${err}] updating as NOT duplicated the transactions [${transactions}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });
};
