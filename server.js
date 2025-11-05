import express from 'express';
const app = express();
const PORT = 8082;

app.get('/', (req, res) => {
  res.send('Server is running on localhost:8082');
});

app.listen(PORT, 'localhost', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
