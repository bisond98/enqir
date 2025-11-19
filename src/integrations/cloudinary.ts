// Cloudinary configuration for browser uploads
export const CLOUDINARY_CONFIG = {
  cloudName: 'dlsddhj4m',
  uploadPreset: 'ml_default' // You'll need to create this in Cloudinary dashboard
};

// Upload image to Cloudinary using signed upload with retry logic
export const uploadToCloudinary = async (file: File, retries: number = 2): Promise<string> => {
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
      
      console.log(`Starting Cloudinary upload (attempt ${attempt + 1}/${retries + 1}):`, file.name);
      
      // Create FormData for upload
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

// Alternative: Use unsigned upload (simpler but less secure) with retry logic
export const uploadToCloudinaryUnsigned = async (file: File, retries: number = 2): Promise<string> => {
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

