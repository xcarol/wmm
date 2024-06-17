const { getCategories, addFilter } = require("./database");

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
};
