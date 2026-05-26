import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useTable } from './TableContext';

const newLineId = () =>
  `line_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
import { CartRepository, CartLine } from '../../data/repositories/CartRepository';

export interface CartItem {
  id: string;
  lineId: string;
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
  addItem: (item: Omit<CartItem, 'quantity' | 'lineId'>) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  updateNote: (lineId: string, note: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTax: () => number;
  getServiceFee: () => number;
  getGrandTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function linesToCartItems(lines: CartLine[]): CartItem[] {
  return lines.map((line) => ({
    id: line.food_id,
    lineId: line.id,
    name: line.name,
    price: line.unit_price,
    priceDisplay: line.price_display || `${line.unit_price}`,
    image: null,
    quantity: line.quantity,
    note: line.note,
    options: line.options,
  }));
}

function itemsToLines(items: CartItem[]): CartLine[] {
  return items.map((item) => ({
    id: item.lineId,
    food_id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    price_display: item.priceDisplay,
    note: item.note,
    options: item.options,
  }));
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { sessionId } = useTable();
  const cartRepo = useRef(new CartRepository());
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    skipNextSync.current = true;
    void cartRepo.current
      .getCart(sessionId)
      .then((lines) => {
        if (lines.length) setItems(linesToCartItems(lines));
      })
      .catch((e) => console.error('Load cart failed:', e));
  }, [sessionId]);

  const syncCartToServer = useCallback(
    async (cartItems: CartItem[]) => {
      if (!sessionId) return;
      try {
        await cartRepo.current.syncCart(sessionId, itemsToLines(cartItems));
      } catch (e) {
        console.error('Cart sync failed:', e);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    void syncCartToServer(items);
  }, [items, syncCartToServer]);

  const addItem = (item: Omit<CartItem, 'quantity' | 'lineId'>) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (i) => i.id === item.id && i.note === item.note && i.options === item.options
      );
      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      }
      return [...prevItems, { ...item, lineId: newLineId(), quantity: 1 }];
    });
  };

  const removeItem = (lineId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.lineId !== lineId);
      if (sessionId) {
        skipNextSync.current = true;
        void cartRepo.current
          .syncCart(sessionId, itemsToLines(next))
          .catch((e) => console.error('Cart remove sync failed:', e));
      }
      return next;
    });
  };

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(lineId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.lineId === lineId ? { ...item, quantity } : item))
    );
  };

  const updateNote = (lineId: string, note: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.lineId === lineId ? { ...item, note } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    if (sessionId) {
      skipNextSync.current = true;
      void cartRepo.current
        .syncCart(sessionId, [])
        .catch((e) => console.error('Cart clear sync failed:', e));
    }
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
