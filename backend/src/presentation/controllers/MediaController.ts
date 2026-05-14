/**
 * Upload ảnh menu lên Cloudinary (server-side, giữ bí mật API).
 */

import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../../infrastructure/config/env.config';

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype)) {
      cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF'));
      return;
    }
    cb(null, true);
  },
});

export const menuImageUploadMiddleware = memoryUpload.single('file');

export class MediaController {
  uploadMenuImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        res.status(503).json({
          success: false,
          message:
            'Chưa cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) trên server.',
        });
        return;
      }

      if (!req.file?.buffer) {
        res.status(400).json({ success: false, message: 'Thiếu file ảnh (field name: file)' });
        return;
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const folder = process.env.CLOUDINARY_MENU_FOLDER || 'menu/uploads';

      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            use_filename: true,
            unique_filename: true,
          },
          (err, out) => {
            if (err || !out?.secure_url) {
              reject(err || new Error('Cloudinary upload failed'));
              return;
            }
            resolve({ secure_url: out.secure_url, public_id: out.public_id });
          }
        );
        stream.end(req.file!.buffer);
      });

      res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
