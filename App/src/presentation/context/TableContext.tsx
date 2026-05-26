import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TableRepository } from '../../data/repositories/TableRepository';
import { SessionRepository } from '../../data/repositories/SessionRepository';
import { TableStatus } from '../../domain/models/Table';
import {
  parseCustomerTableUrl,
  resolveWebTableBootstrapHref,
  urlSignalsCustomerTable,
} from '../../utils/parseCustomerTableUrl';
import {
  getSessionToken,
  setSessionToken,
  clearSessionToken,
} from '../../utils/sessionToken';
import { getDeviceFingerprint } from '../../utils/deviceFingerprint';
import { socketService } from '../../services/socketService';
import SessionClosingSoonModal from '../components/SessionClosingSoonModal';

interface TableInfo {
  tableNumber: string | number;
  tableId: string;
  sessionId: string | null;
}

interface TableContextType {
  tableNumber: string | number | null;
  tableId: string | null;
  sessionId: string | null;
  sessionToken: string | null;
  sessionConflict: boolean;
  conflictMinutes?: number;
  isLoading: boolean;
  setTableInfo: (tableNumber: string | number, tableId: string, sessionId?: string) => Promise<void>;
  clearTableInfo: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

const TABLE_STORAGE_KEY = '@restaurant_table_info';
const PING_INTERVAL_MS = 60_000;

export const TableProvider = ({ children }: { children: ReactNode }) => {
  const [tableNumber, setTableNumber] = useState<string | number | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);
  const [sessionConflict, setSessionConflict] = useState(false);
  const [conflictMinutes, setConflictMinutes] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showClosingSoon, setShowClosingSoon] = useState(false);
  const [closingSoonSeconds, setClosingSoonSeconds] = useState<number | undefined>();
  const [closingSoonLoading, setClosingSoonLoading] = useState(false);
  const sessionRepoRef = useRef(new SessionRepository());
  const appStateRef = useRef(AppState.currentState);

  const restoreOrdersFromServer = useCallback(async (sid: string, token: string) => {
    try {
      const state = await sessionRepoRef.current.getState(sid, token);
      if (!state.active) return;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('session:orders-restored', { detail: state.orders })
        );
        window.dispatchEvent(
          new CustomEvent('session:pending-bill', {
            detail: state.pending_bill?.status === 'pending' ? state.pending_bill.id : null,
          })
        );
      }
    } catch (e) {
      console.error('Restore session state failed:', e);
    }
  }, []);

  const startOrJoinSession = useCallback(
    async (tid: string, existingToken?: string | null): Promise<{
      sessionId: string | null;
      token: string | null;
      conflict: boolean;
    }> => {
      const tableRepo = new TableRepository();
      const token = existingToken || (await getSessionToken()) || undefined;
      const fingerprint = await getDeviceFingerprint();
      const result = await tableRepo.createTableSession(tid, 1, token || undefined, fingerprint);
      const session = result.data;
      const newToken = session?.session_token;
      if (newToken) {
        await setSessionToken(newToken);
        setSessionTokenState(newToken);
      }
      if (result.conflict) {
        setSessionConflict(true);
        setConflictMinutes(result.minutesSinceActive);
        if (Platform.OS === 'web') {
          Alert.alert(
            'Bàn đang có khách',
            `Bàn này đang được sử dụng (hoạt động ${result.minutesSinceActive ?? '?'} phút trước). Nhân viên sẽ kiểm tra.`
          );
        }
      } else {
        setSessionConflict(false);
        setConflictMinutes(undefined);
      }
      const sid = session?.id || null;
      if (sid && newToken && !result.conflict) {
        await restoreOrdersFromServer(sid, newToken);
      }
      return { sessionId: sid, token: newToken || null, conflict: result.conflict };
    },
    [restoreOrdersFromServer]
  );

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

        const storedToken = await getSessionToken();
        const { sessionId: sid, token, conflict } = await startOrJoinSession(t.id, storedToken);

        const info: TableInfo = {
          tableNumber: t.number,
          tableId: t.id,
          sessionId: sid || t.currentOrderId || null,
        };
        await AsyncStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(info));
        setTableNumber(t.number);
        setTableId(t.id);
        setSessionId(info.sessionId);
        if (token) setSessionTokenState(token);
        if (conflict) setSessionConflict(true);
        return true;
      } catch (error) {
        console.error('Web table URL bootstrap failed:', error);
        return false;
      }
    };

    const loadFromStorage = async () => {
      const stored = await AsyncStorage.getItem(TABLE_STORAGE_KEY);
      const token = await getSessionToken();
      if (token) setSessionTokenState(token);
      if (stored && !cancelled) {
        const info: TableInfo = JSON.parse(stored);
        setTableNumber(info.tableNumber);
        setTableId(info.tableId);
        setSessionId(info.sessionId);
        if (info.sessionId && token) {
          await restoreOrdersFromServer(info.sessionId, token);
        }
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
            await clearSessionToken();
            if (!cancelled) {
              setTableNumber(null);
              setTableId(null);
              setSessionId(null);
              setSessionTokenState(null);
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
  }, [restoreOrdersFromServer, startOrJoinSession]);

  useEffect(() => {
    if (!sessionId || sessionConflict) return;

    const ping = () => {
      if (appStateRef.current !== 'active') return;
      void sessionRepoRef.current.ping(sessionId).catch(() => undefined);
    };

    ping();
    const timer = setInterval(ping, PING_INTERVAL_MS);

    const onAppStateChange = (next: AppStateStatus) => {
      appStateRef.current = next;
      if (next === 'active') ping();
    };
    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [sessionId, sessionConflict]);

  useEffect(() => {
    if (!sessionId || sessionConflict) return;

    socketService.connect(sessionId);
    socketService.joinTable(sessionId);

    const onClosingSoon = (payload: { seconds_left?: number }) => {
      setClosingSoonSeconds(payload?.seconds_left);
      setShowClosingSoon(true);
    };

    const onSessionEnded = () => {
      setShowClosingSoon(false);
      void clearTableInfo();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        Alert.alert('Phiên bàn đã kết thúc', 'Cảm ơn bạn. Quét mã QR để đặt món lần sau.');
      }
    };

    socketService.on('session:closing_soon', onClosingSoon);
    socketService.on('session:ended', onSessionEnded);

    return () => {
      socketService.off('session:closing_soon', onClosingSoon);
      socketService.off('session:ended', onSessionEnded);
    };
  }, [sessionId, sessionConflict]);

  const handleClosingSoonContinue = async () => {
    if (!sessionId) return;
    setClosingSoonLoading(true);
    try {
      await sessionRepoRef.current.ping(sessionId);
      setShowClosingSoon(false);
    } catch (e) {
      console.error('Ping to extend session failed:', e);
      Alert.alert('Lỗi', 'Không gửi được yêu cầu tiếp tục. Vui lòng thử lại.');
    } finally {
      setClosingSoonLoading(false);
    }
  };

  const handleClosingSoonEnd = async () => {
    if (!sessionId) return;
    setClosingSoonLoading(true);
    try {
      const tableRepo = new TableRepository();
      await tableRepo.endTableSession(sessionId);
      await clearTableInfo();
      setShowClosingSoon(false);
    } catch (e) {
      console.error('End session failed:', e);
      Alert.alert('Lỗi', 'Không kết thúc được phiên. Vui lòng gọi nhân viên.');
    } finally {
      setClosingSoonLoading(false);
    }
  };

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

      if (isDifferentTable && oldTableId && oldSessionId) {
        try {
          const tableRepo = new TableRepository();
          await tableRepo.endTableSession(oldSessionId);
          await tableRepo.updateTableStatus(oldTableId, TableStatus.AVAILABLE);
          await clearSessionToken();
          setSessionTokenState(null);
        } catch (error) {
          console.error('Error ending old table session:', error);
        }
      }

      let sessionIdToSave = newSessionId;
      let tokenToUse = await getSessionToken();

      if (!sessionIdToSave) {
        const result = await startOrJoinSession(newTableId, tokenToUse);
        sessionIdToSave = result.sessionId || undefined;
        tokenToUse = result.token;
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
    } catch (error) {
      console.error('Error saving table info:', error);
      throw error;
    }
  };

  const clearTableInfo = async () => {
    try {
      await AsyncStorage.removeItem(TABLE_STORAGE_KEY);
      await clearSessionToken();
      setTableNumber(null);
      setTableId(null);
      setSessionId(null);
      setSessionTokenState(null);
      setSessionConflict(false);
      setConflictMinutes(undefined);
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
        sessionToken,
        sessionConflict,
        conflictMinutes,
        isLoading,
        setTableInfo,
        clearTableInfo,
      }}
    >
      {children}
      <SessionClosingSoonModal
        visible={showClosingSoon}
        secondsLeft={closingSoonSeconds}
        loading={closingSoonLoading}
        onContinue={() => void handleClosingSoonContinue()}
        onEnd={() => void handleClosingSoonEnd()}
      />
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
