const {
  addFilter,
  applyCategory,
  applyFilter,
  deleteCategories,
  getCategories,
  getCategoryFilters,
  renameCategory,
  deleteFilters,
} = require("./database");

module.exports = (app) => {
  app.get("/category/names", async (req, res) => {
    try {
      const result = await getCategories();
      res.json(result);
    } catch (err) {
      const error = `Error [${err}] retrieving categories names.`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.get("/filter", async (req, res) => {
    let category = '';

    try {
      category = req.query.data.category;
      res.json(await getCategoryFilters(category));
    } catch (err) {
      const error = `Error [${err}] retrieving filter names for category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.put("/filter", async (req, res) => {
    let category = '';
    let filter = '';

    try {
      category = req.body.data.category;
      filter = req.body.data.filter;
      const result = await addFilter(category, filter);
      res.json(result);
      res.status(201);
    } catch (err) {
      const error = `Error [${err}] adding filter [${filter}] to category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/filter/apply", async (req, res) => {
    let category = '';
    let filter = '';

    try {
      category = req.body.data.category;
      filter = req.body.data.filter;
      res.json(await applyFilter(category, filter));
    } catch (err) {
      const error = `Error [${err}] apply filter [${filter}] of category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/filter/delete", async (req, res) => {
    let filters = '';

    try {
      filters = req.body.data.filters;
      const result = await deleteFilters(filters);
      res.json(result);
    } catch (err) {
      const error = `Error [${err}] deleting filters [${filters}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/filter/category/delete", async (req, res) => {
    let categories = [];

    try {
      categories = req.body.data.categories;
      const result = await deleteCategories(categories);
      res.json(result);
    } catch (err) {
      const error = `Error [${err}] deleting categories [${categories}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/filter/category/apply", async (req, res) => {
    let category = '';

    try {
      category = req.body.data.category;
      const result = await applyCategory(category);
      res.json(result);
    } catch (err) {
      const error = `Error [${err}] applying category [${category}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });

  app.post("/filter/category/rename", async (req, res) => {
    let newName = '';
    let oldName = '';

    try {
      newName = req.body.data.newName;
      oldName = req.body.data.oldName
      const result = await renameCategory(oldName, newName);
      res.json(result);
    } catch (err) {
      const error = `Error [${err}] renaming category [${oldName}] to [${newName}].`;
      console.error(error);
      res.status(500).send(error);
    }
  });
};
