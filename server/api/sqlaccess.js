const { executeSql, backupDatabase } = require("./database");
const path = require("path");

module.exports = (app) => {
  app.post("/sql", async (req, res) => {
    let query = '';

    try {
      query = req.body.data.query;
      const queryResult = await executeSql(query);
      res.json(queryResult);
    } catch (err) {
      const error = `Error '${err}' executing sql command: '${data.query}'`;
      console.error(error);
      res.status(400).send(error);
    }
  });

  app.get("/sql/backup", async (req, res) => {
    try {
      res.sendFile(await backupDatabase());
      res.status(201);
    } catch (err) {
      const error = `Error [${err}] creating database backup.`;
      console.error(error);
      res.status(400).send(error);
    }
  });
};
