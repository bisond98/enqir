const CLOUDINARY_CONFIG = {
  cloudName: 'dlsddhj4m',
  uploadPreset: 'ml_default',
};

/** Draw a subtle tiled "enqir" watermark over a canvas. */
const drawEnqirWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.05));
  ctx.save();
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.06));

  // Tile diagonally across the whole image (rotate around the center)
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  const diag = Math.sqrt(w * w + h * h);
  const stepX = fontSize * 7;
  const stepY = fontSize * 5;

  for (let y = -diag / 2; y <= diag / 2; y += stepY) {
    for (let x = -diag / 2; x <= diag / 2; x += stepX) {
      ctx.strokeText('enqir', x, y);
      ctx.fillText('enqir', x, y);
    }
  }
  ctx.restore();
};

interface CompressOptions {
  /** Bake an "enqir" watermark into the image (used for listings & enquiry reference photos). */
  watermark?: boolean;
}

/**
 * Client-side image compression before upload.
 * Camera captures are 5-10x larger than gallery picks (and HEIC on iPhones).
 * Downscaling to a max edge + JPEG re-encoding makes camera shots upload as fast
 * as gallery ones. Falls back to the original file if decoding fails
 * (e.g. HEIC on non-Safari browsers, CORS-tainted images).
 */
const compressImage = async (file: File, maxEdge = 1600, quality = 0.85, opts: CompressOptions = {}): Promise<File> => {
  const watermark = opts.watermark === true;

  // Never touch formats that don't benefit from canvas re-encode (unless watermarking)
  if (!watermark && (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml')) {
    return file;
  }
  if (file.type === 'image/svg+xml') {
    return file;
  }
  // Small, already-web-friendly files pass through untouched (but still get watermarked)
  const SMALL_ENOUGH = 400 * 1024; // 400 KB
  if (!watermark && file.size <= SMALL_ENOUGH && file.type !== 'image/heic' && file.type !== 'image/heif') {
    return file;
  }

  try {
    let bitmap: ImageBitmap | HTMLImageElement;
    let width: number;
    let height: number;

    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
    } else {
      // Fallback decode (older Safari) — also handles HEIC on iOS
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = () => reject(new Error('decode failed'));
          el.src = url;
        });
        bitmap = img;
        width = img.naturalWidth;
        height = img.naturalHeight;
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    }

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
    if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

    if (watermark) {
      drawEnqirWatermark(ctx, w, h);
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    // Without a watermark, keep the original if re-encoding made it bigger.
    // With a watermark we always want the watermarked version.
    if (!watermark && blob.size >= file.size) return file;

    const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    // Any decode failure → upload the original file as before
    return file;
  }
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  // Compress camera/gallery images client-side before upload (falls back to original on failure)
  file = await compressImage(file);
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`Image is too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload an image file (JPG, PNG, etc.).');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
  formData.append('folder', 'id-verification');
  
  // Upload to Cloudinary with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorMessage = `Upload failed (${response.status})`;
      
      if (response.status === 400) {
        errorMessage = 'Invalid image file. Please check the file and try again.';
      } else if (response.status === 401) {
        errorMessage = 'Upload authentication failed. Please contact support.';
      } else if (response.status === 413) {
        errorMessage = 'Image file is too large. Please use a smaller image.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    if (!result.secure_url) {
      throw new Error('Upload succeeded but no URL received. Please try again.');
    }
    
    console.log('Cloudinary upload successful:', result.secure_url);
    return result.secure_url;
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    
    if (fetchError.name === 'AbortError') {
      throw new Error('Upload timed out. Please check your internet connection and try again.');
    }
    throw fetchError;
  }
};


// Alternative: Use unsigned upload (simpler but less secure) with retry logic
// Pass `watermark: true` to bake an "enqir" watermark into the image before upload.
export const uploadToCloudinaryUnsigned = async (file: File, retries: number = 2, watermark: boolean = false): Promise<string> => {
  // Compress camera/gallery images client-side before upload (falls back to original on failure)
  file = await compressImage(file, 1600, 0.85, { watermark });

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Check network connectivity before attempting upload
      if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error(`Image is too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image file (JPG, PNG, etc.).');
      }
      
      console.log(`Starting unsigned Cloudinary upload (attempt ${attempt + 1}/${retries + 1}):`, file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      
      // Upload to Cloudinary with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          let errorMessage = `Upload failed (${response.status})`;
          
          if (response.status === 400) {
            errorMessage = 'Invalid image file. Please check the file and try again.';
          } else if (response.status === 401) {
            errorMessage = 'Upload authentication failed. Please contact support.';
          } else if (response.status === 413) {
            errorMessage = 'Image file is too large. Please use a smaller image.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again in a moment.';
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (!result.secure_url) {
          throw new Error('Upload succeeded but no URL received. Please try again.');
        }
        
        console.log('Cloudinary upload successful:', result.secure_url);
        return result.secure_url;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload timed out. Please check your internet connection and try again.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Cloudinary upload error (attempt ${attempt + 1}/${retries + 1}):`, lastError);
      
      // Don't retry for certain errors
      if (lastError.message.includes('too large') || 
          lastError.message.includes('Invalid file type') ||
          lastError.message.includes('No internet connection')) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 seconds
        console.log(`Retrying upload in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw new Error(lastError?.message || 'Failed to upload image after multiple attempts. Please try again.');
};

// Upload any file type (audio, video, documents) to Cloudinary using auto resource type
export const uploadToCloudinaryAuto = async (file: File): Promise<string> => {
  if (!navigator.onLine) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  // Compress images client-side (audio/video/documents pass through untouched)
  if (file.type.startsWith('image/')) {
    file = await compressImage(file);
  }

  const maxSize = 20 * 1024 * 1024; // 20MB for non-image files
  if (file.size > maxSize) {
    throw new Error(`File is too large. Maximum size is 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (!result.secure_url) {
      throw new Error('Upload succeeded but no URL received.');
    }

    return result.secure_url;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Upload timed out. Please try again.');
    }
    throw err;
  }
};
