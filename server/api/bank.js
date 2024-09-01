const { getBankNames, getBankBalance } = require('./database');

module.exports = (app) => {
  app.get('/banks/names', async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get('/banks/balance', async (req, res) => {
    try {
      const bank = req.query.bank;
      let startDate = new Date(
        isNaN(Date.parse(req.query.start)) ? '1970/01/01' : req.query.start,
      ).toISOString();
      let endDate = new Date(
        isNaN(Date.parse(req.query.end)) ? Date.now() : req.query.end,
      ).toISOString();

      res.json(await getBankBalance(bank, startDate, endDate));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
