const {
  addTransaction,
  getUncategorizedTransactions,
  updateTransactionsCategory,
} = require("./database");

module.exports = (app) => {
  app.put("/transaction", async (req, res) => {
    try {
      const data = req.body;
      await addTransaction(data.date, data.description, data.amount, data.bank);
      res.json("OK");
      res.status(201);
    } catch (err) {
      console.error("Error adding a transaction:", err);
      res.status(500).send("Error adding transactions");
    }
  });
  app.post("/transaction/category", async (req, res) => {
    try {
      const data = req.body;
      await updateTransactionsCategory(data.transactions, data.category);
      res.json("OK");
      res.status(200);
    } catch (err) {
      console.error("Error updating transactions category:", err);
      res.status(500).send("Error updating transactions category");
    }
  });
  app.get("/transaction/uncategorized", async (req, res) => {
    try {
      const data = req.query;
      const transactions = await getUncategorizedTransactions(data["filter"]);
      res.json(transactions);
    } catch (err) {
      console.error("Error getting uncategorized transactions:", err);
      res.status(500).send("Error getting uncategorized transactions");
    }
  });
};
