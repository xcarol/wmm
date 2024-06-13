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
};
