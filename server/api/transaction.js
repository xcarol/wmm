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
    try {
      const data = req.body;
      res.json(
        await addTransaction(
          data.date,
          data.description,
          data.amount,
          data.bank
        )
      );
      res.status(201);
    } catch (err) {
      console.error("Error adding a transaction:", err);
      let code = 500;
      if (err.sqlState) {
        code = 400;
      }
      res.status(code).send(`Error adding transactions: ${err}`);
    }
  });

  app.post("/transaction/delete", async (req, res) => {
    try {
      const data = req.body;
      res.json(await deleteTransactions(data.transactions));
    } catch (err) {
      console.error("Error adding a transaction:", err);
      let code = 500;
      if (err.sqlState) {
        code = 400;
      }
      res.status(code).send(`Error adding transactions: ${err}`);
    }
  });

  app.post("/transaction/category", async (req, res) => {
    try {
      const data = req.body;
      res.json(
        await updateTransactionsCategory(data.transactions, data.category)
      );
    } catch (err) {
      console.error("Error updating transactions category:", err);
      res.status(500).send("Error updating transactions category");
    }
  });

  app.post("/transaction/category/reset", async (req, res) => {
    try {
      const data = req.body;
      res.json(await resetTransactionsCategories(data.categories));
    } catch (err) {
      console.error("Error reseting transactions category:", err);
      res.status(500).send("Error reseting transactions category");
    }
  });

  app.post("/transaction/filter", async (req, res) => {
    try {
      const data = req.body;
      res.json(await updateTransactionsByFilter(data.filter));
    } catch (err) {
      console.error("Error updating transactions category by filter:", err);
      res.status(500).send("Error updating transactions category by filter");
    }
  });

  app.get("/transaction/uncategorized", async (req, res) => {
    try {
      const data = req.query;
      res.json(await getUncategorizedTransactions(data["filter"]));
    } catch (err) {
      console.error("Error getting uncategorized transactions:", err);
      res.status(500).send("Error getting uncategorized transactions");
    }
  });

  app.get("/transaction/duplicated", async (req, res) => {
    try {
      const data = req.query;
      res.json(await getDuplicatedTransactions());
    } catch (err) {
      console.error("Error getting duplicated transactions:", err);
      res.status(500).send("Error getting duplicated transactions");
    }
  });

  app.post("/transaction/duplicated", async (req, res) => {
    try {
      const data = req.body;
      res.json(await updateTransactionsAsNotDuplicated(data.transactions));
    } catch (err) {
      console.error("Error updating transactions as NOT duplicated:", err);
      res.status(500).send("Error updating transactions as NOT duplicated");
    }
  });
};
