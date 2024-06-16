const {
  addTransaction,
  getUncategorizedTransactions,
  updateTransactionsCategory,
  updateTransactionsByFilter,
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

  app.post("/transaction/category", async (req, res) => {
    try {
      const data = req.body;
      res.json(
        await updateTransactionsCategory(data.transactions, data.category)
      );
      res.status(200);
    } catch (err) {
      console.error("Error updating transactions category:", err);
      res.status(500).send("Error updating transactions category");
    }
  });

  app.post("/transaction/filter", async (req, res) => {
    try {
      const data = req.body;
      res.json(await updateTransactionsByFilter(data.filter));
      res.status(200);
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
};
