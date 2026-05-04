import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TableInfo {
  tableNumber: string | number; // Support both string and number
  tableId: string;
  sessionId: string | null;
}

interface TableContextType {
  tableNumber: string | number | null;
  tableId: string | null;
  sessionId: string | null;
  isLoading: boolean;
  setTableInfo: (tableNumber: string | number, tableId: string, sessionId?: string) => Promise<void>;
  clearTableInfo: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

const TABLE_STORAGE_KEY = '@restaurant_table_info';

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [tableNumber, setTableNumber] = useState<string | number | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load table info from AsyncStorage on mount
  useEffect(() => {
    loadTableInfo();
  }, []);

  const loadTableInfo = async () => {
    try {
      const stored = await AsyncStorage.getItem(TABLE_STORAGE_KEY);
      if (stored) {
        const info: TableInfo = JSON.parse(stored);
        setTableNumber(info.tableNumber);
        setTableId(info.tableId);
        setSessionId(info.sessionId);
      }
    } catch (error) {
      console.error('Error loading table info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTableInfo = async (
    newTableNumber: string | number,
    newTableId: string,
    newSessionId?: string
  ) => {
    try {
      const info: TableInfo = {
        tableNumber: newTableNumber,
        tableId: newTableId,
        sessionId: newSessionId || null,
      };
      
      await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(info));
      
      setTableNumber(newTableNumber);
      setTableId(newTableId);
      setSessionId(newSessionId || null);
    } catch (error) {
      console.error('Error saving table info:', error);
      throw error;
    }
  };

  const clearTableInfo = async () => {
    try {
      await AsyncStorage.removeItem(TABLE_STORAGE_KEY);
      setTableNumber(null);
      setTableId(null);
      setSessionId(null);
    } catch (error) {
      console.error('Error clearing table info:', error);
      throw error;
    }
  };

  return (
    <TableContext.Provider
      value={{
        tableNumber,
        tableId,
        sessionId,
        isLoading,
        setTableInfo,
        clearTableInfo,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};
