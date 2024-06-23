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
      console.error("Error fetching categories:", err);
      res.status(500).send("Error retrieving categories");
    }
  });

  app.get("/filter", async (req, res) => {
    try {
      const data = req.query;
      res.json(await getCategoryFilters(data["category"]));
    } catch (err) {
      console.error("Error retrieving filters:", err);
      res.status(500).send("Error retrieving filters");
    }
  });

  app.put("/filter", async (req, res) => {
    try {
      const data = req.body;
      const result = await addFilter(data.category, data.filter);
      res.json(result);
      res.status(201);
    } catch (err) {
      console.error("Error inserting category filter:", err);
      res.status(500).send("Error inserting category filter");
    }
  });

  app.post("/filter/apply", async (req, res) => {
    try {
      const data = req.body;
      const result = await applyFilter(data.filter);
      res.json(result);
      res.status(200);
    } catch (err) {
      console.error("Error apply filter:", err);
      res.status(500).send("Error apply filter");
    }
  });

  app.post("/filter/delete", async (req, res) => {
    try {
      const data = req.body;
      const result = await deleteFilters(data.filters);
      res.json(result);
      res.status(200);
    } catch (err) {
      console.error("Error deleting filter:", err);
      res.status(500).send("Error deleting filter");
    }
  });

  app.post("/filter/category/delete", async (req, res) => {
    try {
      const data = req.body;
      const result = await deleteCategories(data.categories);
      res.json(result);
      res.status(200);
    } catch (err) {
      console.error("Error deleting category:", err);
      res.status(500).send("Error deleting category");
    }
  });

  app.post("/filter/category/apply", async (req, res) => {
    try {
      const data = req.body;
      const result = await applyCategory(data.category);
      res.json(result);
      res.status(200);
    } catch (err) {
      console.error("Error applying categories:", err);
      res.status(500).send("Error applying categories");
    }
  });

  app.post("/filter/category/rename", async (req, res) => {
    try {
      const data = req.body;
      const result = await renameCategory(data.oldName, data.newName);
      res.json(result);
      res.status(200);
    } catch (err) {
      console.error("Error renaming categories:", err);
      res.status(500).send("Error renaming categories");
    }
  });
};
