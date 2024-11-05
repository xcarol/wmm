const { executeSql, backupDatabase, sqlStatus } = require('./database');

module.exports = (app) => {
  app.post('/sql', async (req, res) => {
    let query = '';

    try {
      query = req.body.query;
      const queryResult = await executeSql(query);
      res.json(queryResult);
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });

  app.get('/sql/backup', async (req, res) => {
    try {
      res.sendFile(await backupDatabase());
      res.status(201);
    } catch (err) {
      res.status(sqlStatus(err)).send(err);
    }
  });
};
