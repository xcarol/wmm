const { getBankNames } = require("./database");

module.exports = (app) => {
  app.get("/banks/names", async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(error);
    }
  });
};
