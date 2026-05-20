import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  ImageSourcePropType,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IMAGES } from '../../domain/constants/images';
import { MenuService } from '../../business/services/MenuService';
import { useCart } from '../context/CartContext';
import { useTable } from '../context/TableContext';
import { MenuItem as DomainMenuItem } from '../../domain/models/MenuItem';
import { MenuGridSkeleton } from '../components/MenuSkeleton';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  image: ImageSourcePropType;
  badge?: string;
  badgeColor?: string;
  available: boolean;
  category: string;
  description?: string;
}

interface HomeMenuScreenProps {
  onCartPress?: () => void;
  onNavigate?: (screen: string) => void;
  onMenuItemPress?: (item: MenuItem) => void;
}

const CATEGORIES = [
  { id: 'all', name: 'Tất cả', icon: 'restaurant' as const },
  { id: 'main', name: 'Món chính', icon: 'fast-food' as const },
  { id: 'starters', name: 'Khai vị', icon: 'pizza' as const },
  { id: 'desserts', name: 'Tráng miệng', icon: 'ice-cream' as const },
  { id: 'drinks', name: 'Đồ uống', icon: 'wine' as const },
  { id: 'specials', name: 'Đặc biệt', icon: 'star' as const },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function HomeMenuScreen({ 
  onCartPress,
  onNavigate,
  onMenuItemPress,
}: HomeMenuScreenProps) {
  // ✅ LẤY THÔNG TIN BÀN TỪ CONTEXT THAY VÌ DÙNG GIÁ TRỊ MẶC ĐỊNH
  const { tableNumber: contextTableNumber } = useTable();
  const tableNumber = contextTableNumber || 'Chưa chọn';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Sử dụng CartContext
  const { addItem, getItemCount, getGrandTotal } = useCart();
  const cartCount = getItemCount();
  const cartTotal = formatCurrency(getGrandTotal());

  // Khởi tạo MenuService
  const menuService = new MenuService();

  // Load menu items từ service
  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const items: DomainMenuItem[] = await menuService.getMenuItems();
      // Chuyển đổi từ domain MenuItem sang presentation MenuItem
      const displayItems: MenuItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        price: formatCurrency(item.price),
        priceValue: item.price,
        image: item.image,
        badge: item.badge,
        badgeColor: item.badgeColor,
        available: item.available,
        category: mapCategoryToId(item.category),
        description: item.description,
      }));
      setMenuItems(displayItems);
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const items: DomainMenuItem[] = await menuService.refreshMenuItems();
      const displayItems: MenuItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        price: formatCurrency(item.price),
        priceValue: item.price,
        image: item.image,
        badge: item.badge,
        badgeColor: item.badgeColor,
        available: item.available,
        category: mapCategoryToId(item.category),
        description: item.description,
      }));
      setMenuItems(displayItems);
    } catch (error) {
      console.error('Error refreshing menu:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper để map MenuCategory enum sang category id
  const mapCategoryToId = (category: any): string => {
    const categoryMap: { [key: string]: string } = {
      'appetizer': 'starters',
      'khai vị': 'starters',
      'khai vi': 'starters',
      'main_course': 'main',
      'main': 'main',
      'món chính': 'main',
      'mon chinh': 'main',
      'dessert': 'desserts',
      'tráng miệng': 'desserts',
      'trang mieng': 'desserts',
      'beverage': 'drinks',
      'drink': 'drinks',
      'drinks': 'drinks',
      'đồ uống': 'drinks',
      'do uong': 'drinks',
      'special': 'specials',
      'specials': 'specials',
      'đặc biệt': 'specials',
      'dac biet': 'specials',
    };
    return categoryMap[(category || '').toString().trim().toLowerCase()] || 'main';
  };

  // Filter menu items theo category và search
  const filteredMenuItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const isActive = selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isActive && styles.categoryChipActive,
        ]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Ionicons 
          name={item.icon} 
          size={14} 
          color={isActive ? '#FFFFFF' : '#78716C'} 
        />
        <Text style={[
          styles.categoryText,
          isActive && styles.categoryTextActive,
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={[
        styles.menuCard,
        !item.available && styles.menuCardDisabled,
      ]}
      onPress={() => {
        if (item.available && onMenuItemPress) {
          onMenuItemPress(item);
        }
      }}
      activeOpacity={0.9}
      disabled={!item.available}
    >
      {!item.available && (
        <View style={styles.outOfStockOverlay}>
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>HẾT MÓN</Text>
          </View>
        </View>
      )}
      
      <View style={styles.menuImageContainer}>
        <Image 
          source={item.image} 
          style={styles.menuImage}
          resizeMode="cover"
        />
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.menuCardContent}>
        <Text 
          style={[
            styles.menuItemName,
            !item.available && styles.menuItemNameDisabled,
          ]} 
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.menuCardFooter}>
          <Text style={[
            styles.menuItemPrice,
            !item.available && styles.menuItemPriceDisabled,
          ]}>
            {item.price}
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              !item.available && styles.addButtonDisabled,
            ]}
            disabled={!item.available}
            activeOpacity={0.7}
            onPress={(e) => {
              console.log('========================================');
              console.log('🔘 ADD BUTTON PRESSED!');
              console.log('Item:', item.name);
              console.log('Price string:', item.price);
              
              // Ngăn event bubble lên parent TouchableOpacity
              e.stopPropagation();
              
              // Thêm món vào giỏ hàng bằng giá VND gốc, không parse từ text hiển thị.
              const priceNumber = item.priceValue;
              console.log('Price number:', priceNumber);
              
              const cartItem = {
                id: item.id,
                name: item.name,
                price: priceNumber,
                priceDisplay: item.price,
                image: item.image,
                category: item.category,
              };
              
              console.log('Adding to cart:', cartItem);
              addItem(cartItem);
              console.log('✅ Item added to cart');
              console.log('========================================');
            }}
          >
            <Ionicons 
              name="add" 
              size={18} 
              color={item.available ? '#FFFFFF' : '#A8A29E'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Image
              source={IMAGES.logo || {
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArnTfjRLZru7KNj5NM-LDZ4RieiB5P5MrK3XmQWbB4WLtxNeiq8GvVhAoUiX77QrePayEp9yXDgjAE_rNuGgR6GDG24e36mjnmzwyygaw8Gv0GU5s-ylnJb08ryqNvH5IzGfBRQjXB_MtwgeCpvHA0z142jhtyE3mfDR8l3VX8OAeupw71MUFKcduVik2NknDmCUFnAlQ2elxnHpXtMtB5NON-05nkD4V8-VjSs8FzS8hzhdwRKaBm5bx3U4Sa73-epeZUKuz7Ag',
              }}
              style={styles.logo}
            />
            <Text style={styles.headerTitle}>GOURMET TECH</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.locationLabel}>VỊ TRÍ</Text>
            <Text style={styles.tableNumber}>Bàn {tableNumber}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#A8A29E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm món ăn..."
            placeholderTextColor="#A8A29E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#AD2C00']}
            tintColor="#AD2C00"
            title="Đang tải menu..."
            titleColor="#AD2C00"
          />
        }
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={IMAGES.hero.menuBanner || {
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJkUO9U_p8ksZX8wKyKR8VsCNd4zE6A3RpWYi0XbQph2kq-dpK37AN2yVm3rfyNqPdCEORfT4tbEyjIGEfeVEXwl2dCRdZlJFd3rnAyMQbMbZiVZzqs0smSPeuL-EUJv6UNaRLaRjuizRT3Iq-U3t3DkbBB6LYJEItPvtN6eZnNsCLWaDEeFw1dqqB_pkWcZ6x_UIFWRBQThm0oe7uXZfDGi6l0uBQFeu9pVsxuyNKXmv7Qu2fyTuqnWMVcW1O8LEtAVtN4PYG_w',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>MÓN MỚI</Text>
            </View>
            <Text style={styles.heroTitle}>Tinh hoa ẩm thực</Text>
            <Text style={styles.heroSubtitle}>
              Trải nghiệm thực đơn bếp trưởng thiết kế riêng.
            </Text>
          </View>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {loading ? (
            <MenuGridSkeleton />
          ) : filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <View key={item.id} style={styles.menuGridItem}>
                {renderMenuItem({ item })}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#A8A29E" />
              <Text style={styles.emptyText}>
                Không tìm thấy món ăn nào
              </Text>
              <Text style={styles.emptySubtext}>
                Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      <TouchableOpacity 
        style={styles.cartButton}
        onPress={onCartPress}
        activeOpacity={0.9}
      >
        <View style={styles.cartLeft}>
          <View style={styles.cartIconContainer}>
            <Ionicons name="basket" size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.cartLabel}>GIỎ HÀNG CỦA BẠN</Text>
            <Text style={styles.cartTotal}>{cartTotal}</Text>
          </View>
        </View>
        <View style={styles.cartRight}>
          <Text style={styles.cartButtonText}>XEM ĐƠN HÀNG</Text>
          <Ionicons name="chevron-forward" size={14} color="#AD2C00" />
        </View>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate?.('explore')}
        >
          <Ionicons name="compass" size={26} color="#AD2C00" />
          <Text style={[styles.navText, styles.navTextActive]}>Khám phá</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate?.('orders')}
        >
          <Ionicons name="receipt" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Lịch sử</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate?.('support')}
        >
          <Ionicons name="hand-right" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Hỗ trợ</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate?.('table')}
        >
          <Ionicons name="restaurant" size={26} color="#A8A29E" />
          <Text style={styles.navText}>Bàn của tôi</Text>
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
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1C1B1B',
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  locationLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1.5,
  },
  tableNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AD2C00',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE7E7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1B1B',
  },
  categoriesContainer: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F4F4F5',
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#AD2C00',
    shadowColor: '#AD2C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 200,
  },
  heroBanner: {
    margin: 16,
    height: 176,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1C1B1B',
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#006A35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 6,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 10,
    color: '#D4D4D8',
    maxWidth: 200,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  menuGridItem: {
    width: '48%',
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1B1B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#78716C',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuCardDisabled: {
    opacity: 0.6,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: 'rgba(28, 27, 27, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '-12deg' }],
  },
  outOfStockText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  menuImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  menuCardContent: {
    padding: 12,
  },
  menuItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1B1B',
    marginBottom: 8,
  },
  menuItemNameDisabled: {
    color: '#A8A29E',
  },
  menuCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#AD2C00',
  },
  menuItemPriceDisabled: {
    color: '#A8A29E',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D83900',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D83900',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  cartButton: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: '#1C1B1B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#AD2C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A8A29E',
    letterSpacing: 1.5,
  },
  cartTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#AD2C00',
    letterSpacing: 0.5,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A8A29E',
  },
  navTextActive: {
    fontWeight: '700',
    color: '#AD2C00',
  },
});
