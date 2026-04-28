const express = require('express');
const router = express.Router();

// Mock data cho development
let menuItems = [
  {
    id: '1',
    name: 'Phở bò',
    description: 'Phở bò truyền thống Hà Nội',
    price: 50000,
    category: 'Món chính',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Bún chả',
    description: 'Bún chả Hà Nội đặc biệt',
    price: 45000,
    category: 'Món chính',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Cơm tấm',
    description: 'Cơm tấm sườn bì chả',
    price: 40000,
    category: 'Món chính',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Trà đá',
    description: 'Trà đá miễn phí',
    price: 0,
    category: 'Đồ uống',
    isAvailable: true,
  },
];

// Get all menu items
router.get('/', async (req, res) => {
  res.json(menuItems);
});

// Get menu item by id
router.get('/:id', async (req, res) => {
  const item = menuItems.find(i => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  res.json(item);
});

// Create menu item (cần auth)
router.post('/', async (req, res) => {
  const newItem = {
    id: Date.now().toString(),
    ...req.body,
  };
  menuItems.push(newItem);
  res.status(201).json(newItem);
});

// Update menu item (cần auth)
router.put('/:id', async (req, res) => {
  const index = menuItems.findIndex(i => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Menu item not found' });
  }
  menuItems[index] = { ...menuItems[index], ...req.body };
  res.json(menuItems[index]);
});

// Delete menu item (cần auth)
router.delete('/:id', async (req, res) => {
  menuItems = menuItems.filter(i => i.id !== req.params.id);
  res.json({ message: 'Menu item deleted' });
});

module.exports = router;
