/**
 * Script to set up Supabase Storage bucket for recipe images
 * Run this script to ensure the 'recipe-images' bucket exists
 */

import { supabase } from '../services/supabaseService';

async function setupStorageBucket() {
  console.log('[Setup] Setting up Supabase Storage bucket for recipe images...');
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('[Setup] Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'recipe-images');
    
    if (bucketExists) {
      console.log('[Setup] ✅ Bucket "recipe-images" already exists');
      return true;
    }
    
    // Create the bucket
    console.log('[Setup] Creating bucket "recipe-images"...');
    const { data, error } = await supabase.storage.createBucket('recipe-images', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB limit
    });
    
    if (error) {
      console.error('[Setup] Error creating bucket:', error);
      return false;
    }
    
    console.log('[Setup] ✅ Successfully created bucket "recipe-images"');
    
    // Set up RLS policy for the bucket (allow authenticated users to upload/read their own images)
    console.log('[Setup] Setting up RLS policies...');
    
    // Note: RLS policies for storage are typically set up in the Supabase dashboard
    // or via SQL commands. For now, we'll just log the recommended policies.
    console.log('[Setup] 📝 Recommended RLS policies for recipe-images bucket:');
    console.log('1. Allow authenticated users to upload: auth.uid()::text = (storage.foldername(name))[1]');
    console.log('2. Allow public read access: true');
    console.log('3. Allow users to delete their own images: auth.uid()::text = (storage.foldername(name))[1]');
    
    return true;
  } catch (error) {
    console.error('[Setup] Exception setting up storage bucket:', error);
    return false;
  }
}

async function testStorageAccess() {
  console.log('[Setup] Testing storage access...');
  
  try {
    // Try to list objects in the bucket (should be empty initially)
    const { data, error } = await supabase.storage
      .from('recipe-images')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('[Setup] Error accessing bucket:', error);
      return false;
    }
    
    console.log('[Setup] ✅ Successfully accessed bucket "recipe-images"');
    console.log(`[Setup] Current objects in bucket: ${data?.length || 0}`);
    return true;
  } catch (error) {
    console.error('[Setup] Exception testing storage access:', error);
    return false;
  }
}

async function main() {
  console.log('[Setup] Starting Supabase Storage setup...');
  
  const bucketSetup = await setupStorageBucket();
  if (!bucketSetup) {
    console.error('[Setup] ❌ Failed to set up storage bucket');
    process.exit(1);
  }
  
  const accessTest = await testStorageAccess();
  if (!accessTest) {
    console.error('[Setup] ❌ Failed to access storage bucket');
    process.exit(1);
  }
  
  console.log('[Setup] ✅ Storage setup completed successfully!');
  console.log('[Setup] You can now use the image storage service to persist DALL-E images.');
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { setupStorageBucket, testStorageAccess };