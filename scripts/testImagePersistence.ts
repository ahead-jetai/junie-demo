/**
 * Test script to verify DALL-E image persistence functionality
 * This script tests the image storage service without affecting production data
 */

import { isDallETemporaryUrl, persistDallEImage } from '../services/imageStorageService';
import { setupStorageBucket, testStorageAccess } from './setupStorage';

// Mock DALL-E URLs for testing (these are example URLs that match the pattern)
const mockDallEUrls = [
  'https://oaidalleapiprodscus.blob.core.windows.net/private/org-test/user-test/img-test.png?st=2025-08-13T03%3A00%3A00Z&se=2025-08-13T04%3A00%3A00Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=test&sktid=test&skt=2025-08-13T03%3A00%3A00Z&ske=2025-08-14T03%3A00%3A00Z&sks=b&skv=2021-08-06&sig=testSignature',
  'https://oaidalleapiprodscus.blob.core.windows.net/private/org-test2/user-test2/img-test2.png?st=2025-08-13T02%3A00%3A00Z&se=2025-08-13T05%3A00%3A00Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=test2&sktid=test2&skt=2025-08-13T02%3A00%3A00Z&ske=2025-08-14T02%3A00%3A00Z&sks=b&skv=2021-08-06&sig=testSignature2'
];

const nonDallEUrls = [
  'https://example.com/image.png',
  'https://unsplash.com/photos/test.jpg',
  'https://supabase.co/storage/v1/object/public/recipe-images/test.png',
  ''
];

async function testUrlDetection() {
  console.log('🔍 Testing DALL-E URL detection...');
  
  let passed = 0;
  let failed = 0;
  
  // Test DALL-E URLs (should return true)
  for (const url of mockDallEUrls) {
    const result = isDallETemporaryUrl(url);
    if (result) {
      console.log(`✅ Correctly identified DALL-E URL: ${url.substring(0, 80)}...`);
      passed++;
    } else {
      console.log(`❌ Failed to identify DALL-E URL: ${url.substring(0, 80)}...`);
      failed++;
    }
  }
  
  // Test non-DALL-E URLs (should return false)
  for (const url of nonDallEUrls) {
    const result = isDallETemporaryUrl(url);
    if (!result) {
      console.log(`✅ Correctly identified non-DALL-E URL: ${url || '(empty)'}`);
      passed++;
    } else {
      console.log(`❌ Incorrectly identified non-DALL-E URL as DALL-E: ${url || '(empty)'}`);
      failed++;
    }
  }
  
  console.log(`\n📊 URL Detection Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function testStorageSetup() {
  console.log('🏗️  Testing storage setup...');
  
  try {
    const bucketSetup = await setupStorageBucket();
    if (!bucketSetup) {
      console.log('❌ Storage bucket setup failed');
      return false;
    }
    
    const accessTest = await testStorageAccess();
    if (!accessTest) {
      console.log('❌ Storage access test failed');
      return false;
    }
    
    console.log('✅ Storage setup and access tests passed');
    return true;
  } catch (error) {
    console.error('❌ Storage setup test failed:', error);
    return false;
  }
}

async function testImagePersistence() {
  console.log('💾 Testing image persistence (with mock URLs)...');
  
  // Note: We can't actually test image download with mock URLs,
  // but we can test the logic flow
  
  try {
    for (const url of nonDallEUrls.filter(u => u)) {
      const result = await persistDallEImage(url);
      if (result === url) {
        console.log(`✅ Non-DALL-E URL returned unchanged: ${url.substring(0, 50)}...`);
      } else {
        console.log(`❌ Non-DALL-E URL was modified unexpectedly: ${url.substring(0, 50)}...`);
        return false;
      }
    }
    
    console.log('✅ Image persistence logic tests passed');
    return true;
  } catch (error) {
    console.error('❌ Image persistence test failed:', error);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🔧 Running system diagnostics...');
  
  // Check environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_PUBLIC_KEY',
    'OPENAI_DALL_E_API_KEY'
  ];
  
  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: Set (${value.substring(0, 20)}...)`);
    } else {
      console.log(`❌ ${envVar}: Not set`);
      envVarsOk = false;
    }
  }
  
  if (!envVarsOk) {
    console.log('⚠️  Some environment variables are missing. Check your .env file.');
  }
  
  return envVarsOk;
}

async function main() {
  console.log('🧪 DALL-E Image Persistence Test Suite');
  console.log('=====================================\n');
  
  const tests = [
    { name: 'System Diagnostics', fn: runDiagnostics },
    { name: 'URL Detection', fn: testUrlDetection },
    { name: 'Storage Setup', fn: testStorageSetup },
    { name: 'Image Persistence Logic', fn: testImagePersistence }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`\n🔬 Running ${test.name} test...`);
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name} test PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} test FAILED`);
      }
    } catch (error) {
      console.error(`❌ ${test.name} test FAILED with error:`, error);
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The image persistence system is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('1. Run the backfill script to convert existing DALL-E images');
    console.log('2. Test creating new recipes with DALL-E images');
    console.log('3. Verify that images persist after the expiry time');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above and fix any issues.');
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}