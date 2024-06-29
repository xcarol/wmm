const {
  addFilter,
  applyFilter,
  deleteCategories,
  getCategories,
  getCategoryFilters,
  renameCategory,
  deleteFilters,
} = require("./database");

module.exports = (app) => {
  app.get("/categories/names", async (req, res) => {
    try {
      res.json(await getCategories());
    } catch (err) {
      const error = `Error [${err}] retrieving categories names.`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.get("/categories", async (req, res) => {
    let category = '';

    try {
      category = req.query.category;
      res.json(await getCategoryFilters(category));
    } catch (err) {
      const error = `Error [${err}] retrieving filter names for category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/categories/filter", async (req, res) => {
    let category = '';
    let filter = '';

    try {
      category = req.body.category;
      filter = req.body.filter;
      res.json(await addFilter(category, filter));
      res.status(201);
    } catch (err) {
      const error = `Error [${err}] adding filter [${filter}] to category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.put("/categories/filter", async (req, res) => {
    let category = '';
    let filter = '';

    try {
      category = req.body.category;
      filter = req.body.filter;
      res.json(await applyFilter(category, filter));
    } catch (err) {
      const error = `Error [${err}] apply filter [${filter}] of category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.put("/categories/filters", async (req, res) => {
    let filters = '';

    try {
      filters = req.body.filters;
      res.json(await deleteFilters(filters));
    } catch (err) {
      const error = `Error [${err}] deleting filters [${filters}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.put("/categories", async (req, res) => {
    let categories = [];

    try {
      categories = req.body.categories;
      res.json(await deleteCategories(categories));
    } catch (err) {
      const error = `Error [${err}] deleting categories [${categories}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/categories/rename", async (req, res) => {
    let newName = '';
    let oldName = '';

    try {
      newName = req.body.newName;
      oldName = req.body.oldName
      res.json(await renameCategory(oldName, newName));
    } catch (err) {
      const error = `Error [${err}] renaming category [${oldName}] to [${newName}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });
};
