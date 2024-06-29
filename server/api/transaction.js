const {
  addTransaction,
  applyCategory,
  deleteTransactions,
  getDuplicatedTransactions,
  getUncategorizedTransactions,
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
      const error = `Error [${err}] adding transaction with date:[${date}] description:[${description}] amount:[${amount}] bank:[${bank}].`;
      console.error(error);
      res.status(err.sqlState ? 400 : 500).send(error);
    }
  });

  app.put("/transactions", async (req, res) => {
    let transactions;

    try {
      transactions = req.body.transactions;
      res.json(await deleteTransactions(transactions));
    } catch (err) {
      const error = `Error [${err}] deleting transactions [${transactions}].`;
      console.error(error);
      res.status(err.sqlState ? 400 : 500).send(error);
    }
  });

  const transactionsApplyCategory = async (transactions, category) => {
    try {
      return updateTransactionsCategory(transactions, category);
    } catch (err) {
      const error = `Error [${err}] updating transactions [${transactions}] with category [${category}].`;
      throw error;
    }
  };

  const transactionsCategorize = async (category) => {
    try {
      return applyCategory(category);
    } catch (err) {
      const error = `Error [${err}] applying category [${category}].`;
      throw error;
    }
  };

  const transactionsResetCategory = (categories) => {
    try {
      return resetTransactionsCategories(categories);
    } catch (err) {
      const error = `Error [${err}] reseting transactions with categories [${categories}].`;
      throw error;
    }
  };

  app.put("/transactions/category", async (req, res) => {
    try {
      const data = req.body;
      const operation = data.operation;
      switch (operation) {
        case "apply":
          res.json(await transactionsApplyCategory(data.transactions, data.category));
          break;
        case "categorize":
          res.json(await transactionsCategorize(data.category));
          break;
        case "reset":
          res.json(await transactionsResetCategory(data.categories));
          break;
        default:
          const error = `Error [unknow operation: ${operation}] updating transactions category.`;
          throw error;
      }
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.put("/transactions/filter", async (req, res) => {
    let filter;

    try {
      filter = req.body.filter;
      res.json(await updateTransactionsByFilter(filter));
    } catch (err) {
      const error = `Error [${err}] updating transactions that match filter [${filter}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.get("/transactions/uncategorized", async (req, res) => {
    let filter;

    try {
      filter = req.query.filter;
      res.json(await getUncategorizedTransactions(filter));
    } catch (err) {
      const error = `Error [${err}] retrieving uncategorized transactions that match filter [${filter}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.get("/transactions/duplicated", async (req, res) => {
    try {
      res.json(await getDuplicatedTransactions());
    } catch (err) {
      const error = `Error [${err}] retrieving duplicated transactions.`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.put("/transactions/duplicated", async (req, res) => {
    let transactions;

    try {
      transactions = req.body.transactions;
      res.json(await updateTransactionsAsNotDuplicated(transactions));
    } catch (err) {
      const error = `Error [${err}] updating as NOT duplicated the transactions [${transactions}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });
};
