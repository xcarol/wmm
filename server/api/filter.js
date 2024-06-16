const { getCategories, addFilter } = require("./database");

module.exports = (app) => {
  app.get("/category/names", async (req, res) => {
    try {
      res.json(await getCategories());
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).send("Error retrieving categories");
    }
  });

  app.put("/filter", async (req, res) => {
    try {
      const data = req.body;
      res.json(await addFilter(data.category, data.filter));
      res.status(201);
    } catch (err) {
      console.error("Error inserting category filter:", err);
      res.status(500).send("Error inserting category filter");
    }
  });
};
