/**
 * Script test image URLs
 * Kiểm tra xem các URL ảnh có accessible không
 */

import https from 'https';

const testUrls = [
  'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
  'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800',
  'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800',
  'https://images.unsplash.com/photo-1546173159-315724a31696?w=800',
];

async function testImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function testAllUrls() {
  console.log('🧪 Testing image URLs...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (const url of testUrls) {
    const isAccessible = await testImageUrl(url);
    
    if (isAccessible) {
      console.log(`✅ ${url}`);
      successCount++;
    } else {
      console.log(`❌ ${url}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   Success: ${successCount}/${testUrls.length}`);
  console.log(`   Failed: ${failCount}/${testUrls.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All image URLs are accessible!');
  } else {
    console.log('\n⚠️ Some image URLs are not accessible. Please check your internet connection.');
  }
}

testAllUrls();
