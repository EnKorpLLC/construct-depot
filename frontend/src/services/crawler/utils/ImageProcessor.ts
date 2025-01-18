import sharp from 'sharp';
import fetch from 'node-fetch';
import { Storage } from '@google-cloud/storage';

export class ImageProcessor {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || 'product-images';
  }

  async downloadAndProcess(imageUrl: string): Promise<Buffer> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const imageBuffer = await response.buffer();

      // Process image
      return await this.processImage(imageBuffer);
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  private async processImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Optimize image for web
      const processedImage = await sharp(imageBuffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  async uploadToStorage(imageBuffer: Buffer): Promise<string> {
    try {
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);

      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/jpeg',
        },
      });

      // Make the file public
      await file.makePublic();

      // Return the public URL
      return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteFromStorage(imageUrl: string): Promise<void> {
    try {
      const filename = imageUrl.split('/').pop();
      if (!filename) {
        throw new Error('Invalid image URL');
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);

      await file.delete();
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'centre'
        })
        .jpeg({
          quality: 70
        })
        .toBuffer();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  async optimizeForMobile(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 60,
          progressive: true
        })
        .toBuffer();
    } catch (error) {
      console.error('Error optimizing image for mobile:', error);
      throw error;
    }
  }
} 