const {
  addFilter,
  updateFilter,
  deleteCategory,
  getCategories,
  getCategoryFilters,
  renameCategory,
  deleteFilter,
  resetTransactionsCategoryForAFilter,
} = require("./database");

module.exports = (app) => {
  app.get("/categories/names", async (req, res) => {
    try {
      res.json(await getCategories());
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.delete("/categories", async (req, res) => {
    try {
      const category = req.query.category;
      res.json(await deleteCategory(category));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.get("/categories/filters", async (req, res) => {
    let category = "";

    try {
      category = req.query.category;
      res.json(await getCategoryFilters(category));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.post("/categories/filter", async (req, res) => {
    let category = "";
    let filter = "";
    let label = "";

    try {
      category = req.body.category;
      filter = req.body.filter;
      label = req.body.label;
      res.json(await addFilter(category, filter, label));
      res.status(201);
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put("/categories/filter", async (req, res) => {
    let category = "";
    let filter = "";
    let label = "";

    try {
      category = req.body.category;
      filter = req.body.filter;
      label = req.body.label;
      res.json(await updateFilter(category, filter, label));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.delete("/categories/filter", async (req, res) => {
    try {
      const { filter } = req.query;
      const result = await resetTransactionsCategoryForAFilter(filter);
      await deleteFilter(filter);
      res.json(result);
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.post("/categories/rename", async (req, res) => {
    let newName = "";
    let oldName = "";

    try {
      newName = req.body.newName;
      oldName = req.body.oldName;
      res.json(await renameCategory(oldName, newName));
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });
};
