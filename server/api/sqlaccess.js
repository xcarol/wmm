const { executeSql, backupDatabase } = require("./database");
const path = require("path");

module.exports = (app) => {
  app.post("/sql", async (req, res) => {
    const data = req.body;
    try {
      const queryResult = await executeSql(data.query);
      res.json(queryResult);
    } catch (err) {
      console.error("Error executing sql command:", err);
      res
        .status(400)
        .send(`Error '${err}' executing sql command: '${data.query}'`);
    }
  });

  app.get("/sql/backup", async (req, res) => {
    const data = req.body;
    try {
      res.sendFile(await backupDatabase());
      res.status(201);
    } catch (err) {
      console.error("Error creating database backup:", err);
      res
        .status(400)
        .send(`Error '${err}' creating database backup`);
    }
  });
};
