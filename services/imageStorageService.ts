import { supabase, getCurrentUser } from './supabaseService';

/**
 * Service for handling persistent image storage in Supabase Storage
 * Converts temporary DALL-E URLs to permanent Supabase Storage URLs
 */

/**
 * Check if a URL is a temporary DALL-E image URL
 * @param url - The image URL to check
 * @returns True if it's a DALL-E URL with temporary parameters
 */
export function isDallETemporaryUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if it's from the DALL-E CDN and has temporary query parameters
  return url.includes('oaidalleapiprodscus.blob.core.windows.net') && 
         url.includes('se=') && // expiry parameter
         url.includes('sig='); // signature parameter
}

/**
 * Download image from a URL and return as blob
 * @param url - The image URL to download
 * @returns Promise that resolves to the image blob
 */
async function downloadImage(url: string): Promise<Blob> {
  console.log('[ImageStorage] Downloading image from:', url.substring(0, 100) + '...');
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  const blob = await response.blob();
  console.log('[ImageStorage] Downloaded image blob:', {
    size: blob.size,
    type: blob.type
  });
  
  return blob;
}

/**
 * Convert blob to ArrayBuffer using React Native compatible method
 * @param blob - The blob to convert
 * @returns Promise that resolves to ArrayBuffer
 */
async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Upload image blob to Supabase Storage
 * @param blob - The image blob to upload
 * @param userId - The user ID for organizing storage
 * @param recipeId - Optional recipe ID for naming (will generate UUID if not provided)
 * @returns Promise that resolves to the public URL of the uploaded image
 */
async function uploadImageToStorage(blob: Blob, userId: string, recipeId?: string): Promise<string> {
  // Generate a unique filename
  const timestamp = Date.now();
  const randomId = recipeId || Math.random().toString(36).substring(2, 15);
  const extension = blob.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `${randomId}_${timestamp}.${extension}`;
  const filePath = `recipes/${userId}/${fileName}`;
  
  console.log('[ImageStorage] Uploading image to Supabase Storage:', {
    filePath,
    size: blob.size,
    type: blob.type
  });
  
  try {
    // Convert blob to ArrayBuffer using React Native compatible method
    let uploadData: ArrayBuffer | Blob;
    
    // Try to use FileReader first (React Native compatible)
    try {
      uploadData = await blobToArrayBuffer(blob);
      console.log('[ImageStorage] Successfully converted blob to ArrayBuffer using FileReader');
    } catch (fileReaderError) {
      console.log('[ImageStorage] FileReader failed, trying direct blob upload:', fileReaderError);
      // Fallback to direct blob upload (some Supabase versions support this)
      uploadData = blob;
    }
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, uploadData, {
        contentType: blob.type,
        upsert: false
      });
    
    if (error) {
      console.error('[ImageStorage] Error uploading to Supabase Storage:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    console.log('[ImageStorage] Successfully uploaded to:', data.path);
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    console.log('[ImageStorage] Public URL:', publicUrl);
    
    return publicUrl;
  } catch (uploadError) {
    console.error('[ImageStorage] Upload process failed:', uploadError);
    throw uploadError;
  }
}

/**
 * Convert a temporary DALL-E image URL to a permanent Supabase Storage URL
 * @param dalleUrl - The temporary DALL-E image URL
 * @param recipeId - Optional recipe ID for naming
 * @returns Promise that resolves to the permanent Supabase Storage URL
 */
export async function persistDallEImage(dalleUrl: string, recipeId?: string): Promise<string> {
  console.log('[ImageStorage] Persisting DALL-E image:', dalleUrl.substring(0, 100) + '...');
  
  if (!isDallETemporaryUrl(dalleUrl)) {
    console.log('[ImageStorage] URL is not a temporary DALL-E URL, returning as-is');
    return dalleUrl;
  }
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Download the image from DALL-E
    const imageBlob = await downloadImage(dalleUrl);
    
    // Upload to Supabase Storage
    const permanentUrl = await uploadImageToStorage(imageBlob, user.id, recipeId);
    
    console.log('[ImageStorage] Successfully persisted DALL-E image:', {
      originalUrl: dalleUrl.substring(0, 100) + '...',
      permanentUrl: permanentUrl
    });
    
    return permanentUrl;
  } catch (error) {
    console.error('[ImageStorage] Error persisting DALL-E image:', error);
    // Return original URL as fallback
    return dalleUrl;
  }
}

/**
 * Backfill existing DALL-E images by converting them to permanent storage
 * @param batchSize - Number of records to process at once (default: 10)
 * @returns Promise that resolves to the number of images successfully processed
 */
export async function backfillDallEImages(batchSize: number = 10): Promise<number> {
  console.log('[ImageStorage] Starting backfill of DALL-E images...');
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  let processedCount = 0;
  let offset = 0;
  
  while (true) {
    // Query recipes with DALL-E images in batches
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, image, is_dalle_image')
      .eq('user_id', user.id)
      .eq('is_dalle_image', true)
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error('[ImageStorage] Error querying recipes for backfill:', error);
      break;
    }
    
    if (!recipes || recipes.length === 0) {
      console.log('[ImageStorage] No more recipes to process');
      break;
    }
    
    console.log(`[ImageStorage] Processing batch of ${recipes.length} recipes (offset: ${offset})`);
    
    // Process each recipe in the batch
    for (const recipe of recipes) {
      try {
        if (!isDallETemporaryUrl(recipe.image)) {
          console.log(`[ImageStorage] Recipe ${recipe.id} already has permanent URL, skipping`);
          continue;
        }
        
        console.log(`[ImageStorage] Processing recipe ${recipe.id}...`);
        
        // Persist the DALL-E image
        const permanentUrl = await persistDallEImage(recipe.image, recipe.id);
        
        // Update the database record
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ 
            image: permanentUrl,
            is_dalle_image: false // Mark as no longer a temporary DALL-E image
          })
          .eq('id', recipe.id);
        
        if (updateError) {
          console.error(`[ImageStorage] Error updating recipe ${recipe.id}:`, updateError);
        } else {
          processedCount++;
          console.log(`[ImageStorage] Successfully processed recipe ${recipe.id}`);
        }
        
        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`[ImageStorage] Error processing recipe ${recipe.id}:`, error);
      }
    }
    
    offset += batchSize;
    
    // Add a delay between batches
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`[ImageStorage] Backfill completed. Processed ${processedCount} images.`);
  return processedCount;
}