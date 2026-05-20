import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTable } from './TableContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  image: any;
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
const CART_STORAGE_PREFIX = '@cart:';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageScope, setStorageScope] = useState<string | null>(null);
  const [hasLoadedScope, setHasLoadedScope] = useState(false);
  const { tableId, sessionId } = useTable();
  const lastTableScopeRef = useRef<string | null>(null);

  useEffect(() => {
    const scope = sessionId || tableId;
    if (!scope) {
      setItems([]);
      setStorageScope(null);
      setHasLoadedScope(false);
      lastTableScopeRef.current = null;
      return;
    }

    lastTableScopeRef.current = scope;
    setStorageScope(scope);
    setHasLoadedScope(false);

    let cancelled = false;
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(`${CART_STORAGE_PREFIX}${scope}`);
        if (cancelled) return;
        setItems(stored ? JSON.parse(stored) : []);
      } catch (error) {
        console.error('Error loading scoped cart:', error);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setHasLoadedScope(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, tableId]);

  useEffect(() => {
    if (!storageScope || !hasLoadedScope) return;
    void (async () => {
      try {
        const key = `${CART_STORAGE_PREFIX}${storageScope}`;
        if (items.length === 0) {
          await AsyncStorage.removeItem(key);
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(items));
        }
      } catch (error) {
        console.error('Error saving scoped cart:', error);
      }
    })();
  }, [items, storageScope, hasLoadedScope]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((i) => i.id === item.id);

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }

      return [...prevItems, { ...item, quantity: 1 }];
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
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
