/**
 * MANUAL CLEANUP SCRIPT
 * Run this in your browser console to completely clear all notifications for all users
 * 
 * HOW TO USE:
 * 1. Open your app in the browser
 * 2. Open Developer Console (F12 or Cmd+Option+I)
 * 3. Go to "Console" tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. Refresh the page
 */

(function clearAllNotificationData() {
  console.log('🧹 Starting complete notification cleanup...');
  
  let clearedCount = 0;
  
  // Get all localStorage keys
  const allKeys = Object.keys(localStorage);
  
  // Clear ALL notification-related data
  allKeys.forEach(key => {
    if (
      key.includes('notification') || 
      key.includes('notif') ||
      key.startsWith('notifications_') ||
      key.startsWith('notification_prefs_')
    ) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log(`  ❌ Removed: ${key}`);
    }
  });
  
  console.log('');
  console.log('✅ CLEANUP COMPLETE!');
  console.log(`   Cleared ${clearedCount} notification items`);
  console.log('');
  console.log('👉 Now refresh the page to start fresh!');
  console.log('   Only NEW notifications will appear from now on.');
})();

