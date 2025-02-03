import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private cdnUrl?: string;

  constructor() {
    this.region = process.env.AWS_REGION!;
    this.bucket = process.env.AWS_BUCKET_NAME!;
    this.cdnUrl = process.env.AWS_CLOUDFRONT_URL;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Uploads an image to S3 with optimizations
   */
  async uploadImage(
    file: Buffer,
    path: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'webp' | 'png';
    } = {}
  ): Promise<string> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
    } = options;

    // Process image with sharp
    let processedImage = sharp(file);

    // Resize if dimensions provided
    if (width || height) {
      processedImage = processedImage.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to desired format and optimize
    processedImage = processedImage[format]({ quality });

    // Get processed buffer
    const buffer = await processedImage.toBuffer();

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: buffer,
      ContentType: `image/${format}`,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });

    await this.s3Client.send(command);

    // Return the URL
    return this.getImageUrl(path);
  }

  /**
   * Deletes an image from S3
   */
  async deleteImage(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.s3Client.send(command);
  }

  /**
   * Gets a presigned URL for direct browser upload
   */
  async getPresignedUploadUrl(
    path: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Gets the public URL for an image
   */
  private getImageUrl(path: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${path}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
  }
} 