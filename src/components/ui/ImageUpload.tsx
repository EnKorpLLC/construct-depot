'use client';

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => Promise<void>;
  value?: string;
  className?: string;
  aspectRatio?: 'square' | '16:9' | '4:3';
  maxSize?: number; // in MB
}

export function ImageUpload({
  onUpload,
  onRemove,
  value,
  className = '',
  aspectRatio = 'square',
  maxSize = 5, // 5MB default
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const aspectRatioClass = {
    square: 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-4/3',
  }[aspectRatio];

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      await handleFile(file);
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleFile(file);
      }
    },
    [onUpload]
  );

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    try {
      setIsUploading(true);
      const url = await onUpload(file);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (onRemove) {
      try {
        await onRemove();
        toast.success('Image removed successfully');
      } catch (error) {
        console.error('Remove error:', error);
        toast.error('Failed to remove image');
      }
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg ${aspectRatioClass} ${className}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {value ? (
        <div className="relative w-full h-full group">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover rounded-lg"
          />
          {onRemove && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-darker" />
          ) : (
            <>
              <Upload className="w-8 h-8 mb-2 text-grey-lighter" />
              <span className="text-sm text-grey-lighter">
                Drop an image or click to upload
              </span>
              <span className="text-xs text-grey-lighter mt-1">
                Max size: {maxSize}MB
              </span>
            </>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
} 