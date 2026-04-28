const express = require('express');
const router = express.Router();

// Mock data
let orders = [];
let orderCounter = 1;

// Get all orders
router.get('/', async (req, res) => {
  res.json(orders);
});

// Get orders by table
router.get('/table/:tableId', async (req, res) => {
  const tableOrders = orders.filter(o => o.tableId === req.params.tableId);
  res.json(tableOrders);
});

// Create order
router.post('/', async (req, res) => {
  const { tableId, items, total } = req.body;
  
  const newOrder = {
    id: Date.now().toString(),
    orderNumber: orderCounter++,
    tableId,
    items,
    total,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  
  order.status = status;
  res.json(order);
});

module.exports = router;
