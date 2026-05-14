import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTable } from './TableContext';
import {
  fetchTableCartDraft,
  saveTableCartDraft,
  type ServerCartDraftItem,
} from '../../data/api/tableCartDraftApi';
import { fixCloudinaryMenuFoodImageUrl } from '../../utils/cloudinaryMenuImageFixes';

const FALLBACK_MENU_IMAGE = require('../../../assets/images/menu/appetizers/nem-ran.jpg');

export interface CartItem {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  image: any;
  /** URL từ menu / server — luôn lưu khi đồng bộ để khôi phục ảnh sau khi xóa cache */
  imageUrl?: string;
  quantity: number;
  options?: string;
  note?: string;
  category?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNote: (id: string, note: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTax: () => number;
  getServiceFee: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@restaurant_customer_cart_draft';

type StorableCartItem = Omit<CartItem, 'image'> & { imageUrl?: string };

type PersistedCart = {
  tableId: string;
  sessionId: string | null;
  items: StorableCartItem[];
  updatedAt: number;
};

function resolveCartImageUri(url?: string): string | undefined {
  const t = (url || '').trim();
  if (!t) return undefined;
  const fixed = fixCloudinaryMenuFoodImageUrl(t);
  return fixed.trim() || undefined;
}

function toStorableItems(items: CartItem[]): StorableCartItem[] {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    priceDisplay: i.priceDisplay,
    quantity: i.quantity,
    note: i.note,
    options: i.options,
    category: i.category,
    imageUrl: resolveCartImageUri(i.imageUrl || (typeof i.image?.uri === 'string' ? i.image.uri : undefined)),
  }));
}

function fromStorableItems(rows: StorableCartItem[]): CartItem[] {
  return rows.map((i) => {
    const uri = resolveCartImageUri(i.imageUrl);
    return {
      ...i,
      image: uri ? { uri } : FALLBACK_MENU_IMAGE,
      imageUrl: uri,
    };
  });
}

function serverRowsToStorable(rows: ServerCartDraftItem[]): StorableCartItem[] {
  return rows.map((it) => ({
    id: it.id,
    name: it.name,
    price: it.price,
    priceDisplay: it.priceDisplay,
    quantity: it.quantity,
    note: it.note,
    options: it.options,
    category: it.category,
    imageUrl: resolveCartImageUri(it.image_url),
  }));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  return <CartProviderInner>{children}</CartProviderInner>;
};

function CartProviderInner({ children }: { children: ReactNode }) {
  const { tableId, sessionId, isLoading } = useTable();
  const [items, setItems] = useState<CartItem[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHydratedKeyRef = useRef<string>('');
  const skipNextServerPushRef = useRef(false);

  const persistLocal = useCallback(async (next: CartItem[], updatedAt: number) => {
    if (!tableId) return;
    const payload: PersistedCart = {
      tableId,
      sessionId: sessionId ?? null,
      items: toStorableItems(next),
      updatedAt,
    };
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Cart persist failed', e);
    }
  }, [tableId, sessionId]);

  const pushServerDraft = useCallback(
    async (next: CartItem[], updatedAt: number) => {
      if (!sessionId) return;
      try {
        await saveTableCartDraft(sessionId, {
          items: toStorableItems(next).map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            priceDisplay: i.priceDisplay,
            quantity: i.quantity,
            note: i.note,
            options: i.options,
            category: i.category,
            image_url: i.imageUrl,
          })),
          updated_at: updatedAt,
        });
      } catch (e) {
        console.warn('Cart server sync failed (sẽ thử lại khi giỏ thay đổi):', e);
      }
    },
    [sessionId]
  );

  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;
  const pushServerDraftRef = useRef(pushServerDraft);
  pushServerDraftRef.current = pushServerDraft;
  const persistLocalRef = useRef(persistLocal);
  persistLocalRef.current = persistLocal;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    if (!sessionId || !tableId) return;

    const flush = () => {
      const next = itemsRef.current;
      const updatedAt = Date.now();
      void persistLocalRef.current(next, updatedAt);
      void pushServerDraftRef.current(next, updatedAt);
    };

    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [sessionId, tableId]);

  useEffect(() => {
    if (isLoading || !tableId) return;

    const sig = `${tableId}|${sessionId ?? 'pending'}`;
    if (lastHydratedKeyRef.current === sig) return;

    const run = async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
        let local: PersistedCart | null = null;
        if (raw) {
          try {
            local = JSON.parse(raw) as PersistedCart;
          } catch {
            local = null;
          }
        }
        if (local && local.tableId !== tableId) {
          local = null;
        }

        let remoteDraft: { items: ServerCartDraftItem[]; updated_at: number } | null = null;
        if (sessionId) {
          try {
            const { draft, inactive } = await fetchTableCartDraft(sessionId);
            if (!inactive && draft && Array.isArray(draft.items)) {
              remoteDraft = draft;
            }
          } catch (e) {
            console.warn('Cart server fetch failed:', e);
          }
        }

        const storedSession = local?.sessionId ?? null;
        const currentSession = sessionId ?? null;
        const sameSession = String(storedSession) === String(currentSession);
        const pendingToSession = !storedSession && currentSession != null;
        const sessionCompatible = sameSession || pendingToSession;

        const localTs = local?.updatedAt ?? 0;
        const remoteTs = remoteDraft?.updated_at ?? 0;
        let nextItems: CartItem[] = [];

        if (sessionId && remoteDraft != null && remoteTs > localTs) {
          nextItems = fromStorableItems(serverRowsToStorable(remoteDraft.items));
          skipNextServerPushRef.current = true;
        } else if (sessionId && remoteDraft != null && remoteTs === localTs && remoteTs > 0) {
          nextItems = fromStorableItems(serverRowsToStorable(remoteDraft.items));
          skipNextServerPushRef.current = true;
        } else if (local && sessionCompatible && Array.isArray(local.items) && local.items.length > 0) {
          nextItems = fromStorableItems(local.items);
        }

        setItems(nextItems);
      } catch (e) {
        console.error('Cart hydrate failed', e);
      } finally {
        lastHydratedKeyRef.current = sig;
      }
    };

    void run();
  }, [isLoading, tableId, sessionId]);

  useEffect(() => {
    if (!tableId || isLoading) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const updatedAt = Date.now();
      void persistLocal(items, updatedAt);
      if (sessionId) {
        if (skipNextServerPushRef.current) {
          skipNextServerPushRef.current = false;
          return;
        }
        void pushServerDraft(items, updatedAt);
      }
    }, 520);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [items, tableId, sessionId, isLoading, persistLocal, pushServerDraft]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const imageUrl = resolveCartImageUri(
      item.imageUrl || (typeof item.image?.uri === 'string' ? item.image.uri : undefined)
    );
    const image = imageUrl ? { uri: imageUrl } : item.image || FALLBACK_MENU_IMAGE;
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.id === item.id);
      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }
      return [...prevItems, { ...item, image, imageUrl, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updateNote = (id: string, note: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, note } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    void AsyncStorage.removeItem(CART_STORAGE_KEY);
  };

  const getTotal = () => items.reduce((total, item) => total + item.price * item.quantity, 0);

  const getTax = () => getTotal() * 0.08;

  const getServiceFee = () => 0;

  const getGrandTotal = () => getTotal() + getTax() + getServiceFee();

  const getItemCount = () => items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNote,
        clearCart,
        getTotal,
        getTax,
        getServiceFee,
        getGrandTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
