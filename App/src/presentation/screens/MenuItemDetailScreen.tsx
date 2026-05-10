import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../context/CartContext';

interface Topping {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
}

interface MenuItemDetailScreenProps {
  item: {
    id: string;
    name: string;
    price: number;
    priceDisplay: string;
    image: any;
    description?: string;
    category: string;
  };
  onBack: () => void;
  onAddToCart: () => void;
}

const FOOD_TOPPINGS: Topping[] = [
  { id: 'cheese', name: 'Phô mai thêm', price: 15, priceDisplay: '15k' },
  { id: 'egg', name: 'Trứng ốp la', price: 10, priceDisplay: '10k' },
  { id: 'mushroom', name: 'Nấm tươi', price: 12, priceDisplay: '12k' },
  { id: 'extra-sauce', name: 'Sốt đặc biệt', price: 8, priceDisplay: '8k' },
];

const DESSERT_TOPPINGS: Topping[] = [
  { id: 'extra-cream', name: 'Kem tươi thêm', price: 10, priceDisplay: '10k' },
  { id: 'extra-fruit', name: 'Trái cây thêm', price: 12, priceDisplay: '12k' },
  { id: 'extra-syrup', name: 'Syrup thêm', price: 6, priceDisplay: '6k' },
];

// Các lựa chọn mức độ
const SPICE_LEVELS = [
  { id: 'none', name: 'Không cay', icon: '😊' },
  { id: 'mild', name: 'Cay nhẹ', icon: '🌶️' },
  { id: 'medium', name: 'Cay vừa', icon: '🌶️🌶️' },
  { id: 'hot', name: 'Cay nhiều', icon: '🌶️🌶️🌶️' },
];

export default function MenuItemDetailScreen({
  item,
  onBack,
  onAddToCart,
}: MenuItemDetailScreenProps) {
  const { addItem } = useCart();
  const normalizedCategory = (item.category || '').toString().toLowerCase();
  const isDrink = ['drinks', 'đồ uống', 'do uong', 'beverage'].includes(normalizedCategory);
  const isDessert = ['desserts', 'tráng miệng', 'trang mieng', 'dessert'].includes(normalizedCategory);
  const availableToppings = isDrink ? [] : isDessert ? DESSERT_TOPPINGS : FOOD_TOPPINGS;
  const allowSpice = !isDrink && !isDessert;

  const [quantity, setQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>('none');
  const [specialRequest, setSpecialRequest] = useState('');

  // Tính tổng giá
  const calculateTotal = () => {
    let total = item.price * quantity;
    
    selectedToppings.forEach((toppingId) => {
      const topping = availableToppings.find((t) => t.id === toppingId);
      if (topping) {
        total += topping.price * quantity;
      }
    });
    
    return total;
  };

  const total = calculateTotal();

  // Toggle topping
  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) => {
      if (prev.includes(toppingId)) {
        return prev.filter((id) => id !== toppingId);
      } else {
        return [...prev, toppingId];
      }
    });
  };

  // Tăng/giảm số lượng
  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    // Tạo options string
    const options: string[] = [];
    
    if (selectedToppings.length > 0) {
      const toppingNames = selectedToppings
        .map((id) => availableToppings.find((t) => t.id === id)?.name)
        .filter(Boolean);
      options.push(`Topping: ${toppingNames.join(', ')}`);
    }
    
    if (allowSpice && spiceLevel !== 'none') {
      const spice = SPICE_LEVELS.find((s) => s.id === spiceLevel);
      if (spice) {
        options.push(`Độ cay: ${spice.name}`);
      }
    }

    // Thêm từng món với số lượng
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${item.id}_${Date.now()}_${i}`, // Unique ID cho mỗi món
        name: item.name,
        price: calculateTotal() / quantity, // Giá cho 1 món (bao gồm topping)
        priceDisplay: `${(calculateTotal() / quantity).toFixed(1)}k`,
        image: item.image,
        category: item.category,
        options: options.length > 0 ? options.join(' • ') : isDrink ? 'Tuỳ chỉnh đồ uống' : undefined,
        note: specialRequest || undefined,
      });
    }

    Alert.alert(
      'Đã thêm vào giỏ hàng',
      `${quantity} x ${item.name} đã được thêm vào giỏ hàng`,
      [
        { text: 'Tiếp tục chọn món', onPress: onBack },
        { text: 'Xem giỏ hàng', onPress: onAddToCart },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header với ảnh món ăn */}
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} />
        
        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageGradient}
        />

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color="#1C1B1B" />
          </View>
        </TouchableOpacity>

        {/* Tên món ở dưới ảnh */}
        <View style={styles.imageInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{item.priceDisplay}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Mô tả món ăn */}
        {item.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}

        {/* Chọn topping */}
        {availableToppings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="add-circle" size={20} color="#AD2C00" />
              <Text style={styles.sectionTitle}>Thêm topping</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Chọn các topping phù hợp với món</Text>
            
            <View style={styles.toppingList}>
              {availableToppings.map((topping) => {
              const isSelected = selectedToppings.includes(topping.id);
              
              return (
                <TouchableOpacity
                  key={topping.id}
                  style={[
                    styles.toppingItem,
                    isSelected && styles.toppingItemSelected,
                  ]}
                  onPress={() => toggleTopping(topping.id)}
                >
                  <View style={styles.toppingInfo}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[
                      styles.toppingName,
                      isSelected && styles.toppingNameSelected,
                    ]}>
                      {topping.name}
                    </Text>
                  </View>
                  <Text style={[
                    styles.toppingPrice,
                    isSelected && styles.toppingPriceSelected,
                  ]}>
                    +{topping.priceDisplay}
                  </Text>
                </TouchableOpacity>
              );
              })}
            </View>
          </View>
        )}

        {/* Chọn độ cay */}
        {allowSpice && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🌶️</Text>
              <Text style={styles.sectionTitle}>Độ cay</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Chọn mức độ cay phù hợp với bạn</Text>
            
            <View style={styles.spiceList}>
              {SPICE_LEVELS.map((level) => {
              const isSelected = spiceLevel === level.id;
              
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.spiceItem,
                    isSelected && styles.spiceItemSelected,
                  ]}
                  onPress={() => setSpiceLevel(level.id)}
                >
                  <Text style={styles.spiceIcon}>{level.icon}</Text>
                  <Text style={[
                    styles.spiceName,
                    isSelected && styles.spiceNameSelected,
                  ]}>
                    {level.name}
                  </Text>
                </TouchableOpacity>
              );
              })}
            </View>
          </View>
        )}

        {/* Yêu cầu đặc biệt */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color="#AD2C00" />
            <Text style={styles.sectionTitle}>Yêu cầu đặc biệt</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Cho chúng tôi biết nếu bạn có yêu cầu đặc biệt
          </Text>
          
          <TextInput
            style={styles.textInput}
            placeholder="Ví dụ: Không hành, ít dầu mỡ, chín kỹ..."
            placeholderTextColor="#A8A29E"
            value={specialRequest}
            onChangeText={setSpecialRequest}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Số lượng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={20} color="#AD2C00" />
            <Text style={styles.sectionTitle}>Số lượng</Text>
          </View>
          
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={decreaseQuantity}
            >
              <Ionicons name="remove" size={24} color="#AD2C00" />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={increaseQuantity}
            >
              <Ionicons name="add" size={24} color="#AD2C00" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{total.toFixed(1)}k</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddToCart}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#AD2C00', '#D83900']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="cart" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Thêm vào giỏ hàng</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCF9F8',
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  itemName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1B1B',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#78716C',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#5F5E5E',
    lineHeight: 22,
  },
  toppingList: {
    gap: 12,
  },
  toppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F0EDED',
  },
  toppingItemSelected: {
    borderColor: '#AD2C00',
    backgroundColor: 'rgba(173, 44, 0, 0.05)',
  },
  toppingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#AD2C00',
    borderColor: '#AD2C00',
  },
  toppingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1B',
  },
  toppingNameSelected: {
    color: '#AD2C00',
  },
  toppingPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#78716C',
  },
  toppingPriceSelected: {
    color: '#AD2C00',
  },
  spiceList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  spiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#F0EDED',
  },
  spiceItemSelected: {
    borderColor: '#AD2C00',
    backgroundColor: 'rgba(173, 44, 0, 0.05)',
  },
  spiceIcon: {
    fontSize: 18,
  },
  spiceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F5E5E',
  },
  spiceNameSelected: {
    color: '#AD2C00',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1C1B1B',
    borderWidth: 2,
    borderColor: '#F0EDED',
    minHeight: 100,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(173, 44, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1C1B1B',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5F5E5E',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#AD2C00',
    letterSpacing: -0.5,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
