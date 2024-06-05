const { addTransaction } = require("./database");

module.exports = (app) => {
  app.put("/transactions", async (req, res) => {
    try {
      const data = req.body;
      await addTransaction(data.date, data.description, data.amount, data.bank);
      res.status(401);
    } catch (err) {
      console.error("Error adding a transaction:", err);
      res.status(500).send("Error adding transactions");
    }
  });
};
