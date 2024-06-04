const { getBankNames } = require("./database");

module.exports = (app) => {
  app.get("/banknames", async (req, res) => {
    try {
      const banknames = await getBankNames();
      res.json(banknames);
    } catch (err) {
      console.error("Error fetching banknames:", err);
      res.status(500).send("Error retrieving banknames");
    }
  });
};
