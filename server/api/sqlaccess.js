const { executeSql } = require("./database");

module.exports = (app) => {
  app.post("/sql", async (req, res) => {
    const data = req.body;
    try {
      const queryResult = await executeSql(data.query);
      res.json(queryResult);
      res.status(200);
    } catch (err) {
      console.error("Error executing sql command:", err);
      res.status(400).send(`Error '${err}' executing sql command: '${data.query}'`);
    }
  });
};
