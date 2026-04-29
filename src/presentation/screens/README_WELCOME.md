# Welcome Screen

## Mô tả
Màn hình chào mừng khi khách hàng scan QR code tại bàn ăn. Đây là màn hình đầu tiên người dùng thấy khi vào ứng dụng.

## Tính năng
- ✅ Hiển thị số bàn (Table Number)
- ✅ Hero image với gradient overlay
- ✅ Location badge (In-Restaurant Dining)
- ✅ Feature cards (Daily Specials, Fresh Ingredients)
- ✅ 2 action buttons:
  - **Explore Our Menu**: Chuyển đến menu chính
  - **View Drink Selection**: Xem danh sách đồ uống
- ✅ Footer với thông báo "No login required"
- ✅ Gradient button với Linear Gradient
- ✅ Responsive design

## Props
```typescript
interface WelcomeScreenProps {
  tableNumber?: number;        // Số bàn (mặc định: 12)
  onExploreMenu: () => void;   // Callback khi nhấn "Explore Our Menu"
  onViewDrinks: () => void;    // Callback khi nhấn "View Drink Selection"
}
```

## Sử dụng
```tsx
<WelcomeScreen
  tableNumber={12}
  onExploreMenu={() => navigation.navigate('Menu')}
  onViewDrinks={() => navigation.navigate('Drinks')}
/>
```

## Design System
- **Primary Color**: #AD2C00 (Orange Red)
- **Secondary Color**: #5F5E5E (Gray)
- **Tertiary Color**: #006A35 (Green)
- **Background**: #FCF9F8 (Off White)
- **Font**: System (iOS: San Francisco, Android: Roboto)

## Dependencies
- `expo-linear-gradient`: Gradient effects
- `@expo/vector-icons`: Icons (Ionicons, MaterialCommunityIcons)
- `react-native`: Core components

## Chuyển đổi từ HTML
Màn hình này được chuyển đổi từ file `1.html` với các thay đổi:
- Tailwind CSS → React Native StyleSheet
- HTML elements → React Native components
- Material Symbols → @expo/vector-icons
- CSS backdrop-filter → React Native blur effects
- Linear gradient → expo-linear-gradient
