const { getBankNames } = require("./database");

module.exports = (app) => {
  app.get("/bank/names", async (req, res) => {
    try {
      res.json(await getBankNames());
    } catch (err) {
      console.error("Error fetching banknames:", err);
      res.status(500).send("Error retrieving banknames");
    }
  });
};