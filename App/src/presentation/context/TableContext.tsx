import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TableRepository } from '../../data/repositories/TableRepository';
import { TableStatus } from '../../domain/models/Table';
import {
  parseCustomerTableUrl,
  resolveWebTableBootstrapHref,
  urlSignalsCustomerTable,
} from '../../utils/parseCustomerTableUrl';

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

/** Tạo hoặc tái sử dụng phiên bàn — backend luôn đánh dấu occupied + WebSocket cho admin. */
async function ensureTableSession(
  tableId: string,
  tableNumber: string | number
): Promise<string | null> {
  const repo = new TableRepository();
  try {
    const session = await repo.createTableSession(tableId, 1);
    return session?.id ?? null;
  } catch (error) {
    console.error(`ensureTableSession failed for table ${tableNumber}:`, error);
    return null;
  }
}

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [tableNumber, setTableNumber] = useState<string | number | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const tryLoadFromWebTableUrl = async (): Promise<boolean> => {
      if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
      const href = resolveWebTableBootstrapHref();
      const parsed = parseCustomerTableUrl(href);
      const pathForTable = (() => {
        try {
          return new URL(href).pathname;
        } catch {
          return window.location.pathname;
        }
      })();
      const onTablePath = /\/(?:table|t|ban)\//i.test(pathForTable);
      if (!parsed.tableId && !onTablePath) return false;
      try {
        const repo = new TableRepository();
        let t =
          parsed.tableId != null && parsed.tableId.length > 0
            ? await repo.getTableById(parsed.tableId)
            : undefined;
        if (!t && parsed.tableNumber) {
          t = await repo.getTableByNumber(parsed.tableNumber);
        }
        if (cancelled || !t) return false;
        const sessionId = await ensureTableSession(t.id, t.number);
        const info: TableInfo = {
          tableNumber: t.number,
          tableId: t.id,
          sessionId,
        };
        await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(info));
        setTableNumber(t.number);
        setTableId(t.id);
        setSessionId(sessionId);
        return true;
      } catch (error) {
        console.error('Web table URL bootstrap failed:', error);
        return false;
      }
    };

    const loadFromStorage = async () => {
      const stored = await AsyncStorage.getItem(TABLE_STORAGE_KEY);
      if (stored && !cancelled) {
        const info: TableInfo = JSON.parse(stored);
        let sessionId = info.sessionId;
        if (info.tableId) {
          sessionId = await ensureTableSession(info.tableId, info.tableNumber);
          await AsyncStorage.setItem(
            TABLE_STORAGE_KEY,
            JSON.stringify({ ...info, sessionId })
          );
        }
        setTableNumber(info.tableNumber);
        setTableId(info.tableId);
        setSessionId(sessionId);
      }
    };

    const bootstrap = async () => {
      try {
        let fromUrl = await tryLoadFromWebTableUrl();
        const hrefAfter = resolveWebTableBootstrapHref();
        if (!fromUrl && urlSignalsCustomerTable(hrefAfter)) {
          await new Promise((r) => setTimeout(r, 120));
          if (!cancelled) fromUrl = await tryLoadFromWebTableUrl();
        }
        if (!fromUrl) {
          if (urlSignalsCustomerTable(resolveWebTableBootstrapHref())) {
            await AsyncStorage.removeItem(TABLE_STORAGE_KEY);
            if (!cancelled) {
              setTableNumber(null);
              setTableId(null);
              setSessionId(null);
            }
          } else {
            await loadFromStorage();
          }
        }
      } catch (error) {
        console.error('Error loading table info:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void bootstrap();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onLocationTableSignal = () => {
        void tryLoadFromWebTableUrl();
      };
      window.addEventListener('hashchange', onLocationTableSignal);
      window.addEventListener('popstate', onLocationTableSignal);
      return () => {
        cancelled = true;
        window.removeEventListener('hashchange', onLocationTableSignal);
        window.removeEventListener('popstate', onLocationTableSignal);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const setTableInfo = async (
    newTableNumber: string | number,
    newTableId: string,
    newSessionId?: string
  ) => {
    try {
      const oldTableNumber = tableNumber;
      const oldTableId = tableId;
      const oldSessionId = sessionId;
      const isDifferentTable = oldTableNumber !== null && oldTableNumber !== newTableNumber;
      
      console.log(`🔍 setTableInfo called:`, {
        oldTableNumber,
        newTableNumber,
        isDifferentTable,
        oldTableId,
        newTableId,
        oldSessionId
      });
      
      // ✅ XÓA TOÀN BỘ STORAGE TRƯỚC (kể cả lần đầu quét QR)
      console.log(`🧹 Clearing ALL storage before setting new table...`);
      
      // XÓA localStorage và sessionStorage (chỉ trên Web)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('orders');
          localStorage.removeItem('cart');
          sessionStorage.removeItem('orders');
          sessionStorage.removeItem('cart');
          console.log('✅ Web storage cleared');
        } catch (e) {
          console.error('Error clearing web storage:', e);
        }
      }
      
      // Xóa AsyncStorage (React Native) - TRỪ TABLE_STORAGE_KEY để tránh xóa mất thông tin đang set
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter((key) => key === 'orders' || key === 'cart');
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          console.log(`✅ Cleared ${keysToRemove.length} keys from AsyncStorage`);
        }
      } catch (e) {
        console.error('Error clearing AsyncStorage:', e);
      }
      
      // Kết thúc session cũ nếu có VÀ đang đổi bàn
      const shouldEndPreviousSessionOnDeviceSwitch = false;
      if (shouldEndPreviousSessionOnDeviceSwitch && isDifferentTable && oldTableId && oldSessionId) {
        try {
          const tableRepo = new TableRepository();
          await tableRepo.endTableSession(oldSessionId);
          await tableRepo.updateTableStatus(oldTableId, TableStatus.AVAILABLE);
          console.log(`✅ Old table ${oldTableNumber} session ended and set to available`);
        } catch (error) {
          console.error('❌ Error ending old table session:', error);
        }
      }
      
      // ✅ TẠO TABLE SESSION VÀ CẬP NHẬT TRẠNG THÁI BÀN
      let sessionIdToSave: string | null = newSessionId || null;
      
      if (!sessionIdToSave) {
        try {
          console.log(`📡 Creating table session for table ${newTableId}...`);
          sessionIdToSave = await ensureTableSession(newTableId, newTableNumber);
          console.log(`✅ Table session created: ${sessionIdToSave} (backend đã đánh dấu bàn occupied)`);
        } catch (error) {
          console.error('❌ Error creating table session:', error);
          // Vẫn tiếp tục dù không tạo được session
        }
      }
      
      const info: TableInfo = {
        tableNumber: newTableNumber,
        tableId: newTableId,
        sessionId: sessionIdToSave || null,
      };

      await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(info));

      setTableNumber(newTableNumber);
      setTableId(newTableId);
      setSessionId(sessionIdToSave || null);
      
      console.log(`✅ Table info saved:`, info);
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
