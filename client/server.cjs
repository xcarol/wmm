const express = require('express');
const path = require('path');

const app = express();
const distPath = path.resolve(__dirname, 'dist');

app.use(express.static(distPath));

app.get('/env', (req, res) =>
  res.json({
    VITE_API_URL: process.env.VITE_API_URL,
  }),
);

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
