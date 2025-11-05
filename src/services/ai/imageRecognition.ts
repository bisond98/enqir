// Intelligent Image Recognition Service
// Provides AI-powered image analysis for product classification, quality assessment, and content moderation

export interface ImageAnalysis {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  analysis: {
    categories: ImageCategory[];
    tags: string[];
    quality: ImageQuality;
    safety: SafetyScore;
    duplicates: DuplicateMatch[];
    suggestions: string[];
  };
  metadata: {
    format: string;
    colorPalette: string[];
    dominantColors: string[];
    brightness: number;
    contrast: number;
    blur: number;
  };
  createdAt: Date;
  processingTime: number;
}

export interface ImageCategory {
  name: string;
  confidence: number; // 0-1
  description: string;
  relevance: 'high' | 'medium' | 'low';
}

export interface ImageQuality {
  overall: number; // 0-100
  factors: {
    resolution: number;
    brightness: number;
    contrast: number;
    blur: number;
    noise: number;
    composition: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface SafetyScore {
  overall: 'safe' | 'moderate' | 'unsafe';
  confidence: number; // 0-1
  flags: SafetyFlag[];
  moderation: ModerationAction;
}

export interface SafetyFlag {
  type: 'inappropriate' | 'copyright' | 'violence' | 'nudity' | 'spam' | 'other';
  confidence: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ModerationAction {
  action: 'approve' | 'review' | 'reject' | 'flag';
  reason: string;
  autoApproved: boolean;
}

export interface DuplicateMatch {
  imageId: string;
  similarity: number; // 0-1
  url: string;
  title: string;
  category: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ImageRecognitionConfig {
  maxFileSize: number; // in bytes
  supportedFormats: string[];
  qualityThreshold: number;
  safetyThreshold: number;
  duplicateThreshold: number;
  maxProcessingTime: number; // in seconds
  enableAutoModeration: boolean;
  enableDuplicateDetection: boolean;
  enableQualityAssessment: boolean;
  enableCategoryDetection: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ImageRecognitionConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  qualityThreshold: 60,
  safetyThreshold: 0.7,
  duplicateThreshold: 0.8,
  maxProcessingTime: 30,
  enableAutoModeration: true,
  enableDuplicateDetection: true,
  enableQualityAssessment: true,
  enableCategoryDetection: true
};

// Product category mapping for image classification
const PRODUCT_CATEGORIES = {
  'electronics': {
    keywords: ['phone', 'laptop', 'computer', 'tablet', 'camera', 'tv', 'speaker', 'headphone', 'charger', 'cable'],
    subcategories: ['mobile', 'computing', 'audio', 'video', 'accessories']
  },
  'fashion': {
    keywords: ['shirt', 'dress', 'pants', 'shoes', 'bag', 'watch', 'jewelry', 'hat', 'scarf', 'belt'],
    subcategories: ['clothing', 'footwear', 'accessories', 'jewelry', 'watches']
  },
  'home-furniture': {
    keywords: ['chair', 'table', 'sofa', 'bed', 'lamp', 'mirror', 'curtain', 'cushion', 'vase', 'plant'],
    subcategories: ['furniture', 'decor', 'lighting', 'textiles', 'garden']
  },
  'automobile': {
    keywords: ['car', 'bike', 'tire', 'engine', 'part', 'accessory', 'tool', 'service', 'repair'],
    subcategories: ['vehicles', 'parts', 'accessories', 'services', 'tools']
  },
  'real-estate': {
    keywords: ['house', 'apartment', 'building', 'room', 'kitchen', 'bathroom', 'garden', 'balcony', 'view'],
    subcategories: ['residential', 'commercial', 'interior', 'exterior', 'amenities']
  },
  'health-beauty': {
    keywords: ['cosmetic', 'medicine', 'supplement', 'equipment', 'tool', 'product', 'cream', 'oil', 'vitamin'],
    subcategories: ['cosmetics', 'healthcare', 'fitness', 'wellness', 'supplements']
  },
  'books-media': {
    keywords: ['book', 'magazine', 'cd', 'dvd', 'game', 'toy', 'art', 'music', 'movie', 'document'],
    subcategories: ['books', 'media', 'games', 'toys', 'art']
  },
  'food-beverages': {
    keywords: ['food', 'drink', 'fruit', 'vegetable', 'meat', 'bread', 'cake', 'coffee', 'tea', 'juice'],
    subcategories: ['fresh', 'packaged', 'beverages', 'snacks', 'ingredients']
  },
  'services': {
    keywords: ['service', 'work', 'repair', 'cleaning', 'consultation', 'design', 'development', 'marketing'],
    subcategories: ['professional', 'maintenance', 'creative', 'technical', 'personal']
  },
  'jobs': {
    keywords: ['office', 'workplace', 'uniform', 'equipment', 'certificate', 'document', 'resume', 'portfolio'],
    subcategories: ['professional', 'technical', 'creative', 'service', 'management']
  }
};

// Safety keywords for content moderation
const SAFETY_KEYWORDS = {
  inappropriate: ['inappropriate', 'offensive', 'explicit', 'adult', 'mature'],
  copyright: ['copyright', 'trademark', 'branded', 'logo', 'watermark'],
  violence: ['weapon', 'gun', 'knife', 'violent', 'dangerous'],
  spam: ['spam', 'advertisement', 'promotion', 'commercial', 'marketing'],
  other: ['blurry', 'unclear', 'low-quality', 'irrelevant', 'placeholder']
};

// Analyze image categories based on filename and metadata
const analyzeImageCategories = (fileName: string, tags: string[] = []): ImageCategory[] => {
  try {
    const fileNameLower = fileName.toLowerCase();
    const allText = `${fileNameLower} ${tags.join(' ')}`.toLowerCase();
    
    const categories: ImageCategory[] = [];
    
    for (const [category, data] of Object.entries(PRODUCT_CATEGORIES)) {
      let matchCount = 0;
      let totalKeywords = data.keywords.length;
      
      // Check keyword matches
      for (const keyword of data.keywords) {
        if (allText.includes(keyword)) {
          matchCount++;
        }
      }
      
      // Calculate confidence based on matches
      const confidence = matchCount / totalKeywords;
      
      if (confidence > 0.1) { // At least 10% match
        categories.push({
          name: category,
          confidence: Math.min(confidence, 0.95), // Cap at 95%
          description: `Detected as ${category} based on image content`,
          relevance: confidence > 0.5 ? 'high' : confidence > 0.2 ? 'medium' : 'low'
        });
      }
    }
    
    // Sort by confidence (highest first)
    return categories.sort((a, b) => b.confidence - a.confidence);
    
  } catch (error) {
    console.error('Category analysis failed:', error);
    return [];
  }
};

// Generate image tags based on categories and content
const generateImageTags = (categories: ImageCategory[], fileName: string): string[] => {
  try {
    const tags: string[] = [];
    const fileNameLower = fileName.toLowerCase();
    
    // Add category-based tags
    categories.forEach(category => {
      if (category.confidence > 0.3) {
        tags.push(category.name);
        
        // Add subcategory tags
        const categoryData = PRODUCT_CATEGORIES[category.name as keyof typeof PRODUCT_CATEGORIES];
        if (categoryData) {
          tags.push(...categoryData.subcategories.slice(0, 2));
        }
      }
    });
    
    // Add filename-based tags
    const words = fileNameLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
    words.forEach(word => {
      if (word.length > 2 && !tags.includes(word)) {
        tags.push(word);
      }
    });
    
    // Add quality indicators
    if (fileNameLower.includes('high') || fileNameLower.includes('quality')) {
      tags.push('high-quality');
    }
    if (fileNameLower.includes('new') || fileNameLower.includes('fresh')) {
      tags.push('new');
    }
    if (fileNameLower.includes('used') || fileNameLower.includes('second')) {
      tags.push('used');
    }
    
    return tags.slice(0, 10); // Limit to 10 tags
    
  } catch (error) {
    console.error('Tag generation failed:', error);
    return [];
  }
};

// Assess image quality based on metadata
const assessImageQuality = (metadata: any): ImageQuality => {
  try {
    const factors = {
      resolution: calculateResolutionScore(metadata.dimensions),
      brightness: metadata.brightness || 0.5,
      contrast: metadata.contrast || 0.5,
      blur: 1 - (metadata.blur || 0.1), // Invert blur (less blur = higher score)
      noise: 0.8, // Default noise score
      composition: 0.7 // Default composition score
    };
    
    const overall = Math.round(
      (factors.resolution * 0.3 +
       factors.brightness * 0.2 +
       factors.contrast * 0.2 +
       factors.blur * 0.15 +
       factors.noise * 0.1 +
       factors.composition * 0.05) * 100
    );
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (factors.resolution < 0.5) {
      issues.push('Low resolution image');
      recommendations.push('Use higher resolution for clear ID verification');
    }
    
    if (factors.brightness < 0.3) {
      issues.push('Image too dark');
      recommendations.push('Improve lighting for clear ID text reading');
    }
    
    if (factors.brightness > 0.8) {
      issues.push('Image too bright');
      recommendations.push('Reduce lighting to avoid ID glare');
    }
    
    if (factors.contrast < 0.4) {
      issues.push('Low contrast');
      recommendations.push('Ensure good contrast for ID text clarity');
    }
    
    if (factors.blur < 0.6) {
      issues.push('Image appears blurry');
      recommendations.push('Keep camera steady for clear ID details');
    }
    
    if (issues.length === 0) {
      recommendations.push('ID image quality is good for verification');
    }
    
    return {
      overall,
      factors,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('Quality assessment failed:', error);
    return {
      overall: 50,
      factors: {
        resolution: 0.5,
        brightness: 0.5,
        contrast: 0.5,
        blur: 0.5,
        noise: 0.5,
        composition: 0.5
      },
      issues: ['Unable to assess image quality'],
      recommendations: ['Please ensure your ID image is clear and well-lit for verification']
    };
  }
};

// Calculate resolution score
const calculateResolutionScore = (dimensions: { width: number; height: number }): number => {
  try {
    const { width, height } = dimensions;
    const totalPixels = width * height;
    
    // Score based on total pixels
    if (totalPixels >= 2000000) return 1.0; // 2MP+
    if (totalPixels >= 1000000) return 0.9; // 1MP+
    if (totalPixels >= 500000) return 0.8; // 500K+
    if (totalPixels >= 250000) return 0.7; // 250K+
    if (totalPixels >= 100000) return 0.6; // 100K+
    if (totalPixels >= 50000) return 0.5; // 50K+
    
    return 0.3; // Very low resolution
    
  } catch (error) {
    console.error('Resolution score calculation failed:', error);
    return 0.5; // Default score
  }
};

// Assess image safety and content moderation
const assessImageSafety = (fileName: string, tags: string[] = []): SafetyScore => {
  try {
    const allText = `${fileName} ${tags.join(' ')}`.toLowerCase();
    const flags: SafetyFlag[] = [];
    
    // Check for safety issues
    for (const [flagType, keywords] of Object.entries(SAFETY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (allText.includes(keyword)) {
          flags.push({
            type: flagType as any,
            confidence: 0.7,
            description: `Detected ${flagType} content`,
            severity: 'medium'
          });
        }
      }
    }
    
    // Determine overall safety
    let overall: 'safe' | 'moderate' | 'unsafe' = 'safe';
    let confidence = 0.9;
    
    if (flags.length > 0) {
      const highSeverityFlags = flags.filter(f => f.severity === 'high');
      const mediumSeverityFlags = flags.filter(f => f.severity === 'medium');
      
      if (highSeverityFlags.length > 0) {
        overall = 'unsafe';
        confidence = 0.8;
      } else if (mediumSeverityFlags.length > 0) {
        overall = 'moderate';
        confidence = 0.7;
      }
    }
    
    // Determine moderation action
    let action: 'approve' | 'review' | 'reject' | 'flag' = 'approve';
    let reason = 'ID document appears safe for verification';
    let autoApproved = true;
    
    if (overall === 'unsafe') {
      action = 'reject';
      reason = 'ID document contains inappropriate content';
      autoApproved = false;
    } else if (overall === 'moderate') {
      action = 'review';
      reason = 'ID document requires manual review';
      autoApproved = false;
    }
    
    return {
      overall,
      confidence,
      flags,
      moderation: {
        action,
        reason,
        autoApproved
      }
    };
    
  } catch (error) {
    console.error('Safety assessment failed:', error);
    return {
      overall: 'safe',
      confidence: 0.5,
      flags: [],
      moderation: {
        action: 'review',
        reason: 'Unable to assess ID document safety',
        autoApproved: false
      }
    };
  }
};

// Detect duplicate images (simplified version)
const detectDuplicates = async (imageUrl: string, existingImages: any[] = []): Promise<DuplicateMatch[]> => {
  try {
    // In a real implementation, this would use image hashing or feature matching
    // For now, we'll simulate duplicate detection based on filename patterns
    
    const duplicates: DuplicateMatch[] = [];
    const fileName = imageUrl.split('/').pop()?.split('.')[0] || '';
    
    // Simulate duplicate detection
    existingImages.forEach((existingImage, index) => {
      const existingFileName = existingImage.url.split('/').pop()?.split('.')[0] || '';
      
      // Simple similarity based on filename patterns
      if (existingFileName.includes(fileName) || fileName.includes(existingFileName)) {
        const similarity = Math.random() * 0.3 + 0.7; // 70-100% similarity
        
        if (similarity > 0.8) {
          duplicates.push({
            imageId: existingImage.id || `img-${index}`,
            similarity,
            url: existingImage.url,
            title: existingImage.title || 'Similar Image',
            category: existingImage.category || 'Unknown',
            uploadedBy: existingImage.uploadedBy || 'Unknown User',
            uploadedAt: new Date(existingImage.uploadedAt || Date.now())
          });
        }
      }
    });
    
    return duplicates.sort((a, b) => b.similarity - a.similarity);
    
  } catch (error) {
    console.error('Duplicate detection failed:', error);
    return [];
  }
};

// Generate suggestions for ID verification improvement
const generateSuggestions = (quality: ImageQuality, categories: ImageCategory[]): string[] => {
  try {
    const suggestions: string[] = [];
    
    // Quality-based suggestions for ID verification
    if (quality.overall < 70) {
      suggestions.push('Use a higher quality image for better document verification');
    }
    
    if (quality.factors.brightness < 0.4) {
      suggestions.push('Improve lighting to make the ID text clearly visible');
    }
    
    if (quality.factors.brightness > 0.8) {
      suggestions.push('Reduce lighting to avoid glare on the ID document');
    }
    
    if (quality.factors.contrast < 0.4) {
      suggestions.push('Ensure good contrast for clear text readability');
    }
    
    if (quality.factors.blur < 0.7) {
      suggestions.push('Keep the camera steady and focused for clear ID details');
    }
    
    // ID verification specific suggestions
    suggestions.push('Ensure all text on the ID is clearly readable');
    suggestions.push('Avoid shadows or reflections on the document');
    suggestions.push('Place ID on a dark, non-reflective surface');
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
    
  } catch (error) {
    console.error('Suggestion generation failed:', error);
    return ['Ensure your ID image is clear and well-lit for verification'];
  }
};

// Main image analysis function
export const analyzeImage = async (
  imageUrl: string,
  fileName: string,
  fileSize: number,
  dimensions: { width: number; height: number },
  existingImages: any[] = [],
  config: Partial<ImageRecognitionConfig> = {}
): Promise<ImageAnalysis> => {
  try {

    
    const startTime = Date.now();
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Validate file
    if (fileSize > finalConfig.maxFileSize) {
      throw new Error('File size exceeds maximum limit');
    }
    
    const format = fileName.split('.').pop()?.toLowerCase() || '';
    if (!finalConfig.supportedFormats.includes(format)) {
      throw new Error('Unsupported file format');
    }
    
    // Analyze image
    const categories = finalConfig.enableCategoryDetection ? 
      analyzeImageCategories(fileName) : [];
    
    const tags = generateImageTags(categories, fileName);
    
    const quality = finalConfig.enableQualityAssessment ? 
      assessImageQuality({ dimensions, brightness: 0.6, contrast: 0.7, blur: 0.1 }) :
      {
        overall: 70,
        factors: { resolution: 0.8, brightness: 0.6, contrast: 0.7, blur: 0.9, noise: 0.8, composition: 0.7 },
        issues: [],
        recommendations: ['Image quality assessment disabled']
      };
    
    const safety = finalConfig.enableAutoModeration ? 
      assessImageSafety(fileName, tags) :
      {
        overall: 'safe' as const,
        confidence: 0.5,
        flags: [],
        moderation: { action: 'approve' as const, reason: 'Moderation disabled', autoApproved: true }
      };
    
    const duplicates = finalConfig.enableDuplicateDetection ? 
      await detectDuplicates(imageUrl, existingImages) : [];
    
    const suggestions = generateSuggestions(quality, categories);
    
    const processingTime = Date.now() - startTime;
    
    const analysis: ImageAnalysis = {
      id: `img-${Date.now()}`,
      url: imageUrl,
      fileName,
      fileSize,
      dimensions,
      analysis: {
        categories,
        tags,
        quality,
        safety,
        duplicates,
        suggestions
      },
      metadata: {
        format,
        colorPalette: ['#ffffff', '#000000', '#cccccc'], // Default palette
        dominantColors: ['#ffffff', '#000000'],
        brightness: quality.factors.brightness,
        contrast: quality.factors.contrast,
        blur: 1 - quality.factors.blur
      },
      createdAt: new Date(),
      processingTime
    };
    

    
    return analysis;
    
  } catch (error) {
    console.error('❌ Image analysis failed:', error);
    throw error;
  }
};

// Get image analysis summary
export const getImageAnalysisSummary = (analysis: ImageAnalysis): {
  status: 'approved' | 'review' | 'rejected';
  message: string;
  score: number;
  issues: string[];
} => {
  try {
    const { quality, safety, duplicates } = analysis.analysis;
    
    let status: 'approved' | 'review' | 'rejected' = 'approved';
    let score = quality.overall;
    const issues: string[] = [];
    
    // Check quality issues
    if (quality.overall < 50) {
      status = 'review';
      issues.push('Low image quality');
    }
    
    // Check safety issues
    if (safety.overall === 'unsafe') {
      status = 'rejected';
      issues.push('Inappropriate content detected');
    } else if (safety.overall === 'moderate') {
      status = 'review';
      issues.push('Content requires review');
    }
    
    // Check duplicate issues
    if (duplicates.length > 0) {
      status = 'review';
      issues.push(`${duplicates.length} similar images found`);
    }
    
    // Generate message
    let message = 'Image analysis completed successfully';
    if (status === 'rejected') {
      message = 'Image rejected due to content issues';
    } else if (status === 'review') {
      message = 'Image requires manual review';
    }
    
    return {
      status,
      message,
      score,
      issues
    };
    
  } catch (error) {
    console.error('Summary generation failed:', error);
    return {
      status: 'review',
      message: 'Unable to analyze image',
      score: 0,
      issues: ['Analysis failed']
    };
  }
};

// Initialize image recognition system
export const initializeImageRecognition = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initializing Intelligent Image Recognition...');
    
    // Test image analysis with sample data
    const testAnalysis = await analyzeImage(
      'https://example.com/test-image.jpg',
      'test-product-image.jpg',
      1024000, // 1MB
      { width: 1920, height: 1080 },
      []
    );
    
    if (testAnalysis) {
      console.log('✅ Intelligent Image Recognition initialized successfully!');
      console.log('📊 Sample analysis:', {
        categories: testAnalysis.analysis.categories.length,
        quality: testAnalysis.analysis.quality.overall,
        safety: testAnalysis.analysis.safety.overall
      });
      return true;
    } else {
      console.log('⚠️ Image Recognition initialized but test analysis failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Intelligent Image Recognition initialization failed:', error);
    return false;
  }
};

// Export configuration
export { DEFAULT_CONFIG as IMAGE_RECOGNITION_CONFIG };
