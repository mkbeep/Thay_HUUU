import React, { useState } from 'react';
import axios from 'axios';

const TableSelection = ({ onSelectTable }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/tables/select', { tableNumber });
      onSelectTable(response.data.tableId);
    } catch (error) {
      alert('Không thể chọn bàn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Chọn bàn của bạn</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nhập số bàn"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Xác nhận'}
        </button>
      </form>
    </div>
  );
};

export default TableSelection;
