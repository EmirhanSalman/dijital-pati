import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file on the client side before upload
 * @param file - The original image file to compress
 * @returns A compressed File object
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Maximum file size in MB
    maxWidthOrHeight: 1920, // Maximum width or height
    useWebWorker: true, // Use web worker for better performance
    fileType: file.type, // Preserve original file type
  };

  try {
    console.log('🔄 Compressing image...', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      originalType: file.type,
    });

    const compressedFile = await imageCompression(file, options);

    console.log('✅ Image compressed successfully', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
      reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
    });

    return compressedFile;
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    // If compression fails, return original file
    console.warn('⚠️ Returning original file due to compression error');
    return file;
  }
}

