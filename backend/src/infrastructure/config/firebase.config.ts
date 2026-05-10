/**
 * Firebase Configuration
 * Cấu hình kết nối Firebase Admin SDK
 */

import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo Firebase Admin SDK
const initializeFirebase = (): admin.app.App => {
  try {
    // Kiểm tra xem đã khởi tạo chưa
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // Cấu hình từ biến môi trường
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Khởi tạo app
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Khởi tạo Firebase
const firebaseApp = initializeFirebase();

// Export Firestore instance
export const db = admin.firestore();

// Export Firebase Storage bucket
export const bucket = admin.storage().bucket(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`);

// Export Firebase Admin
export const firebaseAdmin = admin;

// Export app
export default firebaseApp;

// Cấu hình Firestore settings
db.settings({
  ignoreUndefinedProperties: true,
});
