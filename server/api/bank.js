const { getBankNames, getBankBalance } = require("./database");

module.exports = (app) => {
  app.get("/banks/names", async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get("/banks/balance", async (req, res) => {
    try {
      const bank = req.query.bank;
      const start = req.query.start;
      const end = req.query.end;

      res.json(await getBankBalance(bank, start, end));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
