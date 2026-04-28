const express = require('express');
const cors = require('cors');
const menuRoutes = require('./routes/menu');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'menu-service' });
});

app.use('/api/menu', menuRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Menu Service running on port ${PORT}`);
});
