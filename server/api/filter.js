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

const MIN_FILTER_LENGTH = 4;

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
    try {
      const { category, filter, label } = req.body;

      if (filter.trim().length < MIN_FILTER_LENGTH) {
        res
          .status(400)
          .send({ message: `minimum filter length is ${MIN_FILTER_LENGTH}` });
        return;
      }

      res.json(await addFilter(category, filter, label));
      res.status(201);
    } catch (err) {
      res.status(err.sqlState ? 400 : 500).send(err);
    }
  });

  app.put("/categories/filter", async (req, res) => {
    try {
      const { filterId, filter, label } = req.body;
      res.json(await updateFilter(filterId, filter, label));
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
