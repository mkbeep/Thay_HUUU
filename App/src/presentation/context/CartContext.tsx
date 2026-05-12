import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '../../domain/models/MenuItem';

// CartItem extends MenuItem và thêm các thuộc tính cho giỏ hàng
export interface CartItem {
  id: string;
  name: string;
  price: number; // Giá dạng số để tính toán (đơn vị: đồng)
  priceDisplay: string; // Giá hiển thị "145k"
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // ✅ KHÔNG tự động restore từ localStorage - Luôn bắt đầu với giỏ hàng trống
  const [items, setItems] = useState<CartItem[]>([]);

  // ✅ Không cần lắng nghe storage event nữa vì không dùng localStorage
  // useEffect(() => {
  //   const handleStorageChange = (e: StorageEvent) => {
  //     if (e.key === 'cart' && e.newValue === null) {
  //       console.log('🧹 Cart cleared by table change');
  //       setItems([]);
  //     }
  //   };
  //   
  //   window.addEventListener('storage', handleStorageChange);
  //   return () => window.removeEventListener('storage', handleStorageChange);
  // }, []);

  // ✅ KHÔNG lưu vào localStorage nữa - Chỉ lưu trong memory
  // Khi đổi bàn, TableContext sẽ clear tất cả và component sẽ unmount/remount
  // useEffect(() => {
  //   try {
  //     if (items.length === 0) {
  //       localStorage.removeItem('cart');
  //       console.log('💾 Removed empty cart from localStorage');
  //     } else {
  //       localStorage.setItem('cart', JSON.stringify(items));
  //       console.log('💾 Saved cart to localStorage:', items.length, 'items');
  //     }
  //   } catch (error) {
  //     console.error('Error saving cart to localStorage:', error);
  //   }
  // }, [items]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    console.log('🛒 CartContext.addItem called:', item);
    
    setItems((prevItems) => {
      console.log('📦 Current cart items:', prevItems.length);
      
      // Kiểm tra xem món đã có trong giỏ chưa
      const existingItemIndex = prevItems.findIndex((i) => i.id === item.id);
      
      if (existingItemIndex > -1) {
        // Nếu đã có, tăng số lượng
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        console.log(`✅ Increased quantity for "${item.name}" to ${newItems[existingItemIndex].quantity}`);
        return newItems;
      } else {
        // Nếu chưa có, thêm mới với quantity = 1
        const newItem = { ...item, quantity: 1 };
        console.log(`✅ Added new item "${item.name}" to cart`);
        return [...prevItems, newItem];
      }
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
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const updateNote = (id: string, note: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, note } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = () => {
    return getTotal() * 0.08; // 8% thuế
  };

  const getServiceFee = () => {
    return 0; // Phí dịch vụ = 0
  };

  const getGrandTotal = () => {
    return getTotal() + getTax() + getServiceFee();
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

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
