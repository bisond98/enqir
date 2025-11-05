// Cloudinary configuration for browser uploads
export const CLOUDINARY_CONFIG = {
  cloudName: 'dlsddhj4m',
  uploadPreset: 'ml_default' // You'll need to create this in Cloudinary dashboard
};

// Upload image to Cloudinary using signed upload
export const uploadToCloudinary = async (file: File): Promise<string> => {
  try {
    console.log('Starting Cloudinary upload for:', file.name);
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    formData.append('folder', 'id-verification');
    
    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Cloudinary upload successful:', result.secure_url);
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error}`);
  }
};

// Alternative: Use unsigned upload (simpler but less secure)
export const uploadToCloudinaryUnsigned = async (file: File): Promise<string> => {
  try {
    console.log('Starting unsigned Cloudinary upload for:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Cloudinary upload successful:', result.secure_url);
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error}`);
  }
};

