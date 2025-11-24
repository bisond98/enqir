import Tesseract from 'tesseract.js';

interface IdVerificationResult {
  matches: boolean;
  extractedNumber?: string;
  error?: string;
  confidence?: number;
}

export async function extractIdNumberFromImage(
  imageUrl: string,
  idType: string
): Promise<{ number: string | null; confidence: number; error?: string }> {
  try {
    // Optimize Tesseract for faster processing
    const { data } = await Tesseract.recognize(imageUrl, 'eng', {
      logger: () => {}, // Disable logging for performance
      // Optimize for speed over accuracy (we validate format anyway)
      tessedit_pageseg_mode: '6', // Assume uniform block of text
      tessedit_char_whitelist: idType === 'aadhaar' ? '0123456789' : '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    });
    
    const extractedText = data.text;
    const confidence = data.confidence || 0;
    
    // Lower threshold - only reject if confidence is very low (below 10%)
    // This allows more images to be processed, and we'll validate the extracted number format
    if (confidence < 10) {
      return {
        number: null,
        confidence: confidence / 100,
        error: 'ID details does not match.'
      };
    }
    
    const normalizedText = extractedText.replace(/\s+/g, ' ').trim();
    let extractedNumber: string | null = null;
    
    switch (idType) {
      case 'aadhaar':
        // Try to find Aadhaar number in multiple formats
        // First try the standard format: XXXX XXXX XXXX
        const aadhaarMatch1 = normalizedText.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/);
        if (aadhaarMatch1) {
          extractedNumber = aadhaarMatch1[0].replace(/[\s-]/g, '');
          // Verify it's exactly 12 digits
          if (extractedNumber.length === 12) {
            break;
          }
        }
        // Try direct 12-digit match (word boundary to avoid partial matches)
        const directMatch = normalizedText.match(/\b\d{12}\b/);
        if (directMatch) {
          extractedNumber = directMatch[0];
          if (extractedNumber.length === 12) {
            break;
          }
        }
        // If still not found, try without word boundary but be more strict
        const fallbackMatch = normalizedText.match(/\d{12}/);
        if (fallbackMatch) {
          extractedNumber = fallbackMatch[0];
        }
        break;
      case 'pan':
        const panMatch = normalizedText.match(/[A-Z]{5}\d{4}[A-Z]{1}/);
        if (panMatch) extractedNumber = panMatch[0];
        break;
      case 'passport':
        const passportMatch = normalizedText.match(/[A-Z]{1}\d{7}/);
        if (passportMatch) extractedNumber = passportMatch[0];
        break;
      case 'driving_license':
        const dlMatch = normalizedText.match(/[A-Z0-9]{10,15}/);
        if (dlMatch) extractedNumber = dlMatch[0];
        break;
      case 'voter_id':
        const voterMatch = normalizedText.match(/[A-Z0-9]{10}/);
        if (voterMatch) extractedNumber = voterMatch[0];
        break;
    }
    
    if (!extractedNumber) {
      return {
        number: null,
        confidence: confidence / 100,
        error: `Could not find ${idType} number in the image. Please ensure the ID number is clearly visible.`
      };
    }
    
    return {
      number: extractedNumber,
      confidence: confidence / 100
    };
  } catch (error) {
    return {
      number: null,
      confidence: 0,
      error: 'Failed to process image. Please try uploading a clearer image.'
    };
  }
}

export async function verifyIdNumberMatch(
  imageUrl: string,
  enteredNumber: string,
  idType: string
): Promise<IdVerificationResult> {
  try {
    if (!imageUrl || !enteredNumber || !idType) {
      return { matches: false, error: 'Missing required information' };
    }
    
    const { number: extractedNumber, confidence, error: extractionError } = await extractIdNumberFromImage(imageUrl, idType);
    
    if (!extractedNumber) {
      return {
        matches: false,
        error: 'ID details does not match.',
        confidence: confidence || 0
      };
    }
    
    const normalizedEntered = enteredNumber.replace(/[\s-]/g, '').toUpperCase();
    const normalizedExtracted = extractedNumber.replace(/[\s-]/g, '').toUpperCase();
    
    // Strict exact match - no partial matches allowed
    const matches = normalizedEntered === normalizedExtracted;
    
    // Additional validation: ensure extracted number matches the expected format
    if (matches) {
      // Double-check the format matches the ID type
      let formatValid = true;
      if (idType === 'aadhaar' && !/^\d{12}$/.test(normalizedExtracted)) {
        formatValid = false;
      } else if (idType === 'pan' && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(normalizedExtracted)) {
        formatValid = false;
      } else if (idType === 'passport' && !/^[A-Z]{1}\d{7}$/.test(normalizedExtracted)) {
        formatValid = false;
      } else if (idType === 'driving_license' && !/^[A-Z0-9]{10,15}$/.test(normalizedExtracted)) {
        formatValid = false;
      } else if (idType === 'voter_id' && !/^[A-Z0-9]{10}$/.test(normalizedExtracted)) {
        formatValid = false;
      }
      
      if (!formatValid) {
        return {
          matches: false,
          extractedNumber: extractedNumber,
          error: `ID details does not match.`,
          confidence: confidence
        };
      }
    }
    
    if (!matches) {
      return {
        matches: false,
        extractedNumber: extractedNumber,
        error: `ID details does not match.`,
        confidence: confidence
      };
    }
    
    return {
      matches: true,
      extractedNumber: extractedNumber,
      confidence: confidence
    };
  } catch (error) {
    return {
      matches: false,
      error: 'Failed to verify ID number. Please try again.'
    };
  }
}

/**
 * Verify ID number against both front and back images
 * Passes if number is found in either image
 */
export async function verifyIdNumberMatchBothSides(
  frontImageUrl: string | null,
  backImageUrl: string | null,
  enteredNumber: string,
  idType: string
): Promise<IdVerificationResult> {
  try {
    if ((!frontImageUrl && !backImageUrl) || !enteredNumber || !idType) {
      return { matches: false, error: 'Missing required information' };
    }
    
    const normalizedEntered = enteredNumber.replace(/[\s-]/g, '').toUpperCase();
    let bestMatch: IdVerificationResult | null = null;
    let foundInFront = false;
    let foundInBack = false;
    
    // Process both images in parallel for faster verification
    const promises: Promise<IdVerificationResult>[] = [];
    
    if (frontImageUrl) {
      promises.push(
        verifyIdNumberMatch(frontImageUrl, enteredNumber, idType)
          .catch(error => {
            console.error('Error verifying front image:', error);
            return { matches: false, error: 'Failed to process front image' };
          })
      );
    }
    
    if (backImageUrl) {
      promises.push(
        verifyIdNumberMatch(backImageUrl, enteredNumber, idType)
          .catch(error => {
            console.error('Error verifying back image:', error);
            return { matches: false, error: 'Failed to process back image' };
          })
      );
    }
    
    // Wait for all verifications to complete in parallel
    const results = await Promise.all(promises);
    
    // Process results
    for (const result of results) {
      if (result.matches) {
        // If any image matches, we're done
        if (!foundInFront && frontImageUrl) {
          foundInFront = true;
          bestMatch = result;
        } else if (!foundInBack && backImageUrl) {
          foundInBack = true;
          bestMatch = result;
        }
        // If we found a match, return immediately
        if (foundInFront || foundInBack) {
          break;
        }
      } else {
        // Store best error result
        if (result.extractedNumber) {
          if (!bestMatch || !bestMatch.extractedNumber) {
            bestMatch = result;
          }
        }
      }
    }
    
    // If found in either image, return success
    if (foundInFront || foundInBack) {
      return {
        matches: true,
        extractedNumber: bestMatch?.extractedNumber,
        confidence: bestMatch?.confidence || 0
      };
    }
    
    // If not found in either, return the best error message
    // Only show error if we actually extracted a number that doesn't match
    if (bestMatch && bestMatch.extractedNumber) {
      return {
        matches: false,
        extractedNumber: bestMatch.extractedNumber,
        error: `ID details does not match.`,
        confidence: bestMatch.confidence || 0
      };
    }
    
    // If no number was extracted from either image, it means images are unclear or number not visible
    return {
      matches: false,
      error: 'ID details does not match.'
    };
  } catch (error) {
    return {
      matches: false,
      error: 'Failed to verify ID number. Please try again.'
    };
  }
}

