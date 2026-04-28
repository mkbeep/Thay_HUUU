const express = require('express');
const router = express.Router();

// Mock sessions storage
const sessions = new Map();

// Khách hàng chọn bàn (tạo session)
router.post('/select', (req, res) => {
  const { tableNumber } = req.body;
  
  if (!tableNumber) {
    return res.status(400).json({ message: 'Table number is required' });
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  sessions.set(sessionId, {
    tableId: tableNumber,
    startTime: new Date().toISOString(),
  });

  res.json({ 
    message: 'Table selected successfully',
    tableId: tableNumber,
    sessionId: sessionId
  });
});

// Lấy thông tin session hiện tại
router.get('/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({ message: 'No active table session' });
  }

  res.json({
    tableId: session.tableId,
    startTime: session.startTime,
    sessionId: req.params.sessionId
  });
});

// Kết thúc session (thanh toán xong)
router.post('/end-session', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    res.json({ message: 'Session ended successfully' });
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

// Quản lý bàn (cần auth)
router.get('/', (req, res) => {
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    tables.push({
      id: i.toString(),
      tableNumber: i.toString(),
      capacity: i <= 5 ? 4 : 6,
      status: 'AVAILABLE',
    });
  }
  res.json(tables);
});

module.exports = router;
