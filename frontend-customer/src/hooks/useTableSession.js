import { useState, useEffect } from 'react';

export const useTableSession = () => {
  const [tableId, setTableIdState] = useState(null);

  useEffect(() => {
    const savedTableId = sessionStorage.getItem('tableId');
    if (savedTableId) {
      setTableIdState(savedTableId);
    }
  }, []);

  const setTableId = (id) => {
    sessionStorage.setItem('tableId', id);
    setTableIdState(id);
  };

  const clearTableId = () => {
    sessionStorage.removeItem('tableId');
    setTableIdState(null);
  };

  return { tableId, setTableId, clearTableId };
};
