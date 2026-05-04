/**
 * Food Seeder
 * Tạo dữ liệu món ăn và hình ảnh
 */

import { db } from '../../config/firebase.config';

export async function seedFoods() {
  const foods = [
    // Appetizers
    {
      name: 'Gỏi Cuốn Tôm Thịt',
      description: 'Gỏi cuốn tươi ngon với tôm, thịt heo, bún và rau sống, chấm nước mắm chua ngọt',
      category: 'appetizer',
      base_price: 45000,
      is_available: true,
      preparation_time: 10,
      calories: 150,
      is_vegetarian: false,
      is_spicy: false,
      allergens: ['shellfish', 'peanuts'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Chả Giò Rế',
      description: 'Chả giò giòn rụm với nhân thịt heo, tôm, mộc nhĩ và rau củ',
      category: 'appetizer',
      base_price: 55000,
      is_available: true,
      preparation_time: 15,
      calories: 250,
      is_vegetarian: false,
      is_spicy: false,
      allergens: ['shellfish', 'eggs'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Salad Rau Củ',
      description: 'Salad tươi mát với rau xà lách, cà chua, dưa leo và sốt dầu giấm',
      category: 'appetizer',
      base_price: 35000,
      is_available: true,
      preparation_time: 8,
      calories: 80,
      is_vegetarian: true,
      is_spicy: false,
      allergens: [],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
          is_primary: true,
          display_order: 1,
        },
      ],
    },

    // Main Courses
    {
      name: 'Phở Bò Đặc Biệt',
      description: 'Phở bò truyền thống với nước dùng hầm xương 12 tiếng, thịt bò tái, nạm, gầu',
      category: 'main_course',
      base_price: 75000,
      is_available: true,
      preparation_time: 15,
      calories: 450,
      is_vegetarian: false,
      is_spicy: false,
      allergens: [],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Bún Chả Hà Nội',
      description: 'Bún chả Hà Nội chính gốc với chả nướng thơm phức, nước mắm chua ngọt',
      category: 'main_course',
      base_price: 65000,
      is_available: true,
      preparation_time: 20,
      calories: 520,
      is_vegetarian: false,
      is_spicy: false,
      allergens: [],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Cơm Tấm Sườn Bì Chả',
      description: 'Cơm tấm Sài Gòn với sườn nướng, bì, chả trứng và nước mắm đặc biệt',
      category: 'main_course',
      base_price: 70000,
      is_available: true,
      preparation_time: 18,
      calories: 680,
      is_vegetarian: false,
      is_spicy: false,
      allergens: ['eggs'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Bún Bò Huế',
      description: 'Bún bò Huế cay nồng với nước dùng sả, giò heo, chả cua',
      category: 'main_course',
      base_price: 68000,
      is_available: true,
      preparation_time: 15,
      calories: 550,
      is_vegetarian: false,
      is_spicy: true,
      allergens: ['shellfish'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Mì Xào Hải Sản',
      description: 'Mì xào giòn với tôm, mực, nghêu và rau củ tươi ngon',
      category: 'main_course',
      base_price: 85000,
      is_available: true,
      preparation_time: 20,
      calories: 620,
      is_vegetarian: false,
      is_spicy: false,
      allergens: ['shellfish', 'gluten'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Cơm Chiên Dương Châu',
      description: 'Cơm chiên Dương Châu với tôm, xúc xích, trứng và rau củ',
      category: 'main_course',
      base_price: 60000,
      is_available: true,
      preparation_time: 15,
      calories: 580,
      is_vegetarian: false,
      is_spicy: false,
      allergens: ['shellfish', 'eggs'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
          is_primary: true,
          display_order: 1,
        },
      ],
    },

    // Desserts
    {
      name: 'Chè Ba Màu',
      description: 'Chè ba màu truyền thống với đậu đỏ, đậu xanh, thạch và nước cốt dừa',
      category: 'dessert',
      base_price: 30000,
      is_available: true,
      preparation_time: 5,
      calories: 280,
      is_vegetarian: true,
      is_spicy: false,
      allergens: [],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Bánh Flan Caramel',
      description: 'Bánh flan mềm mịn với lớp caramel đắng ngọt hài hòa',
      category: 'dessert',
      base_price: 25000,
      is_available: true,
      preparation_time: 5,
      calories: 220,
      is_vegetarian: true,
      is_spicy: false,
      allergens: ['eggs', 'dairy'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Kem Dừa Tươi',
      description: 'Kem dừa tươi mát lạnh, béo ngậy từ nước cốt dừa tự nhiên',
      category: 'dessert',
      base_price: 35000,
      is_available: true,
      preparation_time: 3,
      calories: 180,
      is_vegetarian: true,
      is_spicy: false,
      allergens: ['dairy'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f',
          is_primary: true,
          display_order: 1,
        },
      ],
    },

    // Beverages
    {
      name: 'Cà Phê Sữa Đá',
      description: 'Cà phê phin truyền thống pha với sữa đặc, uống với đá',
      category: 'beverage',
      base_price: 28000,
      is_available: true,
      preparation_time: 8,
      calories: 150,
      is_vegetarian: true,
      is_spicy: false,
      allergens: ['dairy'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Trà Đào Cam Sả',
      description: 'Trà đào cam sả tươi mát, thơm ngon với đào, cam và sả',
      category: 'beverage',
      base_price: 35000,
      is_available: true,
      preparation_time: 5,
      calories: 120,
      is_vegetarian: true,
      is_spicy: false,
      allergens: [],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Nước Chanh Dây',
      description: 'Nước chanh dây tươi mát, chua ngọt vừa phải',
      category: 'beverage',
      base_price: 25000,
      is_available: true,
      preparation_time: 3,
      calories: 80,
      is_vegetarian: true,
      is_spicy: false,
      allergens: [],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
    {
      name: 'Sinh Tố Bơ',
      description: 'Sinh tố bơ béo ngậy, thơm ngon với bơ tươi và sữa đặc',
      category: 'beverage',
      base_price: 40000,
      is_available: true,
      preparation_time: 5,
      calories: 320,
      is_vegetarian: true,
      is_spicy: false,
      allergens: ['dairy'],
      created_at: new Date(),
      updated_at: new Date(),
      images: [
        {
          image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4',
          is_primary: true,
          display_order: 1,
        },
      ],
    },
  ];

  const createdFoods = [];
  for (const food of foods) {
    const { images, ...foodData } = food;
    
    // Create food
    const foodRef = await db.collection('food').add(foodData);
    
    // Create images
    for (const image of images) {
      await db.collection('food_image').add({
        food_id: foodRef.id,
        ...image,
        uploaded_at: new Date(),
      });
    }

    createdFoods.push({ id: foodRef.id, ...foodData });
  }

  // Create toppings
  const toppings = [
    { name: 'Thêm trứng', description: 'Thêm 1 quả trứng', price: 10000, is_available: true },
    { name: 'Thêm thịt', description: 'Thêm phần thịt', price: 20000, is_available: true },
    { name: 'Thêm tôm', description: 'Thêm 3 con tôm', price: 25000, is_available: true },
    { name: 'Thêm rau', description: 'Thêm rau sống', price: 5000, is_available: true },
    { name: 'Thêm phô mai', description: 'Thêm lát phô mai', price: 15000, is_available: true },
  ];

  for (const topping of toppings) {
    await db.collection('food_topping').add({
      ...topping,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return createdFoods;
}
