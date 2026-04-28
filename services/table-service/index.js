const express = require('express');
const cors = require('cors');
const tableRoutes = require('./routes/table');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'table-service' });
});

app.use('/api/tables', tableRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Table Service running on port ${PORT}`);
});
