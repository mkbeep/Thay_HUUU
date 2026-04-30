// Test file để kiểm tra images có load được không
const IMAGES = {
  menu: {
    item1: require('./assets/images/menu/1.png'),
    item2: require('./assets/images/menu/2.png'),
    item3: require('./assets/images/menu/3.png'),
    item4: require('./assets/images/menu/4.png'),
  },
};

console.log('✅ Images loaded successfully:');
console.log('Item 1:', IMAGES.menu.item1);
console.log('Item 2:', IMAGES.menu.item2);
console.log('Item 3:', IMAGES.menu.item3);
console.log('Item 4:', IMAGES.menu.item4);
