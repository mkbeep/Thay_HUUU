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

        // Ưu tiên phiên đang active trên server (tránh lưu session cũ đã kết thúc),
        // rồi mới tạo phiên mới + occupied để admin thấy ngay khi mở link/QR web.
        let sessionIdToUse: string | null = t.currentOrderId ?? null;
        if (!sessionIdToUse) {
          try {
            const session = await repo.createTableSession(t.id, 1);
            sessionIdToUse = session?.id != null ? String(session.id) : null;
          } catch (e) {
            console.error('Web table URL: could not ensure table session', e);
          }
        }

        const info: TableInfo = {
          tableNumber: t.number,
          tableId: t.id,
          sessionId: sessionIdToUse,
        };
        await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(info));
        setTableNumber(t.number);
        setTableId(t.id);
        setSessionId(sessionIdToUse);
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
        setTableNumber(info.tableNumber);
        setTableId(info.tableId);
        setSessionId(info.sessionId);
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

      let previousInfo: TableInfo | null = null;
      try {
        const rawPrevious = await AsyncStorage.getItem(TABLE_STORAGE_KEY);
        if (rawPrevious) previousInfo = JSON.parse(rawPrevious) as TableInfo;
      } catch {
        previousInfo = null;
      }

      const sameTableAsStored =
        previousInfo != null &&
        String(previousInfo.tableNumber) === String(newTableNumber) &&
        previousInfo.tableId === newTableId;

      const isDifferentTable =
        oldTableNumber !== null &&
        (String(oldTableNumber) !== String(newTableNumber) || oldTableId !== newTableId);
      
      console.log(`🔍 setTableInfo called:`, {
        oldTableNumber,
        newTableNumber,
        isDifferentTable,
        sameTableAsStored,
        oldTableId,
        newTableId,
        oldSessionId
      });
      
      // Không gọi localStorage.clear() — trên web nó xóa luôn bản ghi AsyncStorage/@restaurant_table_info
      // và làm mất session bàn khi khách mở lại trình duyệt hoặc quét lại QR.

      // Xóa AsyncStorage (React Native) - TRỪ TABLE_STORAGE_KEY để tránh xóa mất thông tin đang set
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const keysToRemove = allKeys.filter(key => key !== TABLE_STORAGE_KEY);
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
          console.log(`✅ Cleared ${keysToRemove.length} keys from AsyncStorage`);
        }
      } catch (e) {
        console.error('Error clearing AsyncStorage:', e);
      }
      
      // Kết thúc session bàn trước (theo storage) khi khách chọn bàn khác
      if (
        previousInfo?.sessionId &&
        previousInfo.tableId &&
        (previousInfo.tableId !== newTableId ||
          String(previousInfo.tableNumber) !== String(newTableNumber))
      ) {
        try {
          const tableRepo = new TableRepository();
          await tableRepo.endTableSession(previousInfo.sessionId);
          await tableRepo.updateTableStatus(previousInfo.tableId, TableStatus.AVAILABLE);
          console.log(`✅ Ended prior table session ${previousInfo.sessionId}`);
        } catch (error) {
          console.error('❌ Error ending prior table session:', error);
        }
      }
      
      // ✅ TẠO TABLE SESSION VÀ CẬP NHẬT TRẠNG THÁI BÀN
      let sessionIdToSave = newSessionId?.trim() || undefined;
      if (!sessionIdToSave && sameTableAsStored && previousInfo?.sessionId) {
        sessionIdToSave = previousInfo.sessionId;
        console.log(`♻️ Reusing existing table session for same table: ${sessionIdToSave}`);
      }

      if (!sessionIdToSave) {
        try {
          console.log(`📡 Creating table session for table ${newTableId}...`);
          const tableRepo = new TableRepository();
          const session = await tableRepo.createTableSession(newTableId, 1); // Default 1 customer
          sessionIdToSave = session.id;
          console.log(`✅ Table session created: ${sessionIdToSave}`);
          
          // Cập nhật trạng thái bàn thành "occupied"
          await tableRepo.updateTableStatus(newTableId, TableStatus.OCCUPIED);
          console.log(`✅ Table status updated to "occupied"`);
          
          // ✅ WebSocket sẽ được trigger từ backend khi updateTableStatus
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
