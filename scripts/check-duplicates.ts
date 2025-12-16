/**
 * 既存の重複データを検出・削除するスクリプト
 */

import { findExistingDuplicates, removeDuplicates } from '../server/deduplication';

async function main() {
  console.log('=== Checking for duplicate bear sightings ===');
  
  // 重複データを検出
  const duplicates = await findExistingDuplicates();
  
  if (duplicates.length === 0) {
    console.log('No duplicates found!');
    return;
  }
  
  console.log(`Found ${duplicates.length} duplicate pairs:`);
  duplicates.forEach((dup, index) => {
    console.log(`${index + 1}. ID ${dup.id1} vs ID ${dup.id2}: ${dup.reason}`);
  });
  
  // 削除を実行
  console.log('\n=== Removing duplicates ===');
  const removed = await removeDuplicates(duplicates);
  console.log(`Removed ${removed} duplicate sightings`);
  
  console.log('\n=== Duplicate check completed ===');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
