const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/order');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'order-service' });
});

app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
});
