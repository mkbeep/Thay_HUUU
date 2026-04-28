const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes to microservices
app.use('/api/auth', createProxyMiddleware({ 
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true 
}));

app.use('/api/menu', createProxyMiddleware({ 
  target: process.env.MENU_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true 
}));

app.use('/api/orders', createProxyMiddleware({ 
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true 
}));

app.use('/api/tables', createProxyMiddleware({ 
  target: process.env.TABLE_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true 
}));

app.use('/api/payments', createProxyMiddleware({ 
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true 
}));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
