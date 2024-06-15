const { getCategories } = require("./database");

module.exports = (app) => {
  app.get("/category/names", async (req, res) => {
    try {
      const categories = await getCategories();
      res.json(categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).send("Error retrieving categories");
    }
  });

  app.put("/filter", async (req, res) => {
    try {
      const categories = await addFilter();
      res.json(categories);
      res.status(201);
    } catch (err) {
      console.error("Error inserting category filter:", err);
      res.status(500).send("Error inserting category filter");
    }
  });
};
