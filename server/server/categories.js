module.exports = (app, connection) => {
  app.get("/categories", async (req, res) => {
    try {
      const categories = await getAllCategories();
      res.json(categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).send("Error retrieving categories");
    }
  });
};
