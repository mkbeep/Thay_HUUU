import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  private static readonly categoryFolders: Record<string, string> = {
    appetizer: 'appetizers',
    'khai vị': 'appetizers',
    'khai vi': 'appetizers',
    main_course: 'main-courses',
    main: 'main-courses',
    'món chính': 'main-courses',
    'mon chinh': 'main-courses',
    dessert: 'desserts',
    'tráng miệng': 'desserts',
    'trang mieng': 'desserts',
    beverage: 'beverages',
    drink: 'beverages',
    drinks: 'beverages',
    'đồ uống': 'beverages',
    'do uong': 'beverages',
    special: 'specials',
    specials: 'specials',
    'đặc biệt': 'specials',
    'dac biet': 'specials',
  };

  static isConfigured(): boolean {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  static folderForCategory(category?: string): string {
    const normalized = (category || '').toString().trim().toLowerCase();
    return this.categoryFolders[normalized] || 'specials';
  }

  static publicIdFromUrl(imageUrl?: string): string | undefined {
    if (!imageUrl || !imageUrl.includes('res.cloudinary.com')) return undefined;

    try {
      const pathname = new URL(imageUrl).pathname;
      const marker = '/image/upload/';
      const markerIndex = pathname.indexOf(marker);
      if (markerIndex === -1) return undefined;

      let publicPath = pathname.slice(markerIndex + marker.length);
      publicPath = publicPath.replace(/^v\d+\//, '');
      return publicPath.replace(/\.[^/.]+$/, '');
    } catch {
      return undefined;
    }
  }

  static async uploadFoodImage(
    file: Express.Multer.File,
    foodId: string,
    category?: string
  ): Promise<UploadApiResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary chưa được cấu hình');
    }

    const folder = `menu/${this.folderForCategory(category)}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${foodId}-${Date.now()}`,
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload Cloudinary thất bại'));
            return;
          }
          resolve(result);
        }
      );

      stream.end(file.buffer);
    });
  }

  static async deleteImage(publicId?: string): Promise<void> {
    if (!publicId || !this.isConfigured()) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }

  static async moveImageToCategory(
    publicId: string,
    foodId: string,
    category?: string
  ): Promise<UploadApiResponse> {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary chưa được cấu hình');
    }

    const nextPublicId = `menu/${this.folderForCategory(category)}/${foodId}-${Date.now()}`;
    return cloudinary.uploader.rename(publicId, nextPublicId, {
      overwrite: true,
      resource_type: 'image',
    });
  }
}
