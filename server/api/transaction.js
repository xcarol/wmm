const {
  addTransaction,
  addTransactions,
  applyFilters,
  deleteTransactions,
  deleteNewerTransactions,
  getCategoryBalance,
  getCategoryFiltersBalance,
  getCategoryNonFiltersBalance,
  getTimelineByBank,
  getTimelineByCategory,
  getTransactions,
  getDuplicatedTransactions,
  getYears,
  resetTransactionsCategory,
  updateTransactionsCategory,
  updateTransactionsAsNotDuplicated,
} = require('./database');

const prepareTransactions = async (transactions) => {
  transactions.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const transaction = transactions.at(0);
  await deleteNewerTransactions(transaction.bank, transaction.date);

  return transactions;
};

module.exports = (app) => {
  app.post('/transactions', async (req, res) => {
    try {
      const transactions = await prepareTransactions(req.body.transactions);

      res.json(await addTransactions(transactions));
      res.status(201);
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put('/transactions', async (req, res) => {
    let transactions;

    try {
      transactions = req.body.transactions;
      res.json(await deleteTransactions(transactions));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put('/transactions/category', async (req, res) => {
    try {
      const data = req.body;
      const operation = data.operation;
      switch (operation) {
        case 'apply':
          res.json(await applyFilters());
          break;
        case 'update':
          res.json(await updateTransactionsCategory(data.transactions, data.category));
          break;
        case 'reset':
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

  app.get('/transactions/add', async (req, res) => {
    try {
      const { date, bank, category, description, amount } = req.query;
      res.json(await addTransaction(date, bank, category ?? '', description, amount));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get('/transactions/duplicated', async (req, res) => {
    try {
      res.json(await getDuplicatedTransactions());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put('/transactions/duplicated', async (req, res) => {
    let transactions;

    try {
      transactions = req.body.transactions;
      res.json(await updateTransactionsAsNotDuplicated(transactions));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get('/transactions', async (req, res) => {
    try {
      const { bank, start, end, category, filter } = req.query;
      res.json(await getTransactions(bank, start, end, category, filter));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get('/transactions/years', async (req, res) => {
    try {
      res.json(await getYears());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get('/transactions/category', async (req, res) => {
    try {
      const category = req.query.category;
      const filter = req.query.filter;
      const start = req.query.start;
      const end = req.query.end;

      if (filter === undefined) {
        res.json(await getCategoryBalance(category, start, end));
      } else {
        if (filter.length) {
          res.json(await getCategoryFiltersBalance(category, filter, start, end));
        } else {
          res.json(await getCategoryNonFiltersBalance(category, start, end));
        }
      }
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get('/transactions/timeline', async (req, res) => {
    try {
      const { bank, category, period, start, end } = req.query;

      if (category) {
        res.json(await getTimelineByCategory(category, period, start, end));
      } else {
        res.json(await getTimelineByBank(bank, period, start, end));
      }
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
