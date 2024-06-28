const { getBankNames } = require("./database");

module.exports = (app) => {
  app.get("/banks/names", async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      const error = `Error [${err}] retrieving banknames.`;
      console.error(error);
      res.status(500).send(error);
    }
  });
};
