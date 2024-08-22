const {
  addTransaction,
  applyFilters,
  deleteTransactions,
  getCategoryBalance,
  getCategoryFiltersBalance,
  getCategoryNonFiltersBalance,
  getTransactions,
  getDuplicatedTransactions,
  getYears,
  resetTransactionsCategory,
  updateTransactionsCategory,
  updateTransactionsAsNotDuplicated,
  getTransactionsDateRange,
} = require("./database");

const dayjs = require("dayjs");

const canAddTransaction = async ({ date, bank }) => {
  const dateToCheck = dayjs(date).format("YYYY-MM-DD");
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const databaseDates = await getTransactionsDateRange(bank);

  if (
    dateToCheck < databaseDates.max ||
    dateToCheck === today ||
    dateToCheck === yesterday
  ) {
    return false;
  }

  return true;
};

module.exports = (app) => {
  app.post("/transactions", async (req, res) => {
    try {
      const transaction = ({ date, description, amount, bank } = req.body);

      if (await canAddTransaction(transaction)) {
        res.json(await addTransaction(transaction));
        res.status(201);
      } else {
        res.status(400).send({
          message:
            "Cannot add transactions with a date that falls within the bank's date range in database. Transactions from yesterday and today will not be imported, as they may still be pending of being consolidated.",
        });
      }
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
          res.json(await applyFilters());
          break;
        case "update":
          res.json(
            await updateTransactionsCategory(data.transactions, data.category)
          );
          break;
        case "reset":
          res.json(await resetTransactionsCategory(data.category));
          break;
        default:
          throw `Error [unknow operation: ${operation}] updating transactions category.`;
      }
    } catch (err) {
      console.error(err);
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
    try {
      const { bank, start, end, category, filter } = req.query;
      res.json(await getTransactions(bank, start, end, category, filter));
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

  app.get("/transactions/category", async (req, res) => {
    try {
      const category = req.query.category;
      const filter = req.query.filter;
      const start = req.query.start;
      const end = req.query.end;

      if (filter === undefined) {
        res.json(await getCategoryBalance(category, start, end));
      } else {
        if (filter.length) {
          res.json(
            await getCategoryFiltersBalance(category, filter, start, end)
          );
        } else {
          res.json(await getCategoryNonFiltersBalance(category, start, end));
        }
      }
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
