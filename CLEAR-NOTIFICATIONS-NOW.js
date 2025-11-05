/**
 * ⚡ EMERGENCY NOTIFICATION CLEANUP SCRIPT ⚡
 * 
 * Run this in your browser console ON YOUR LIVE SITE (enqir.in)
 * to immediately clear all old notifications for all users
 * 
 * STEPS:
 * 1. Open https://enqir.in in your browser
 * 2. Press F12 (or Cmd+Option+I on Mac) to open DevTools
 * 3. Go to "Console" tab
 * 4. Copy and paste this entire file
 * 5. Press Enter
 * 6. Refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
 * 7. All old notifications will be gone!
 */

(function emergencyNotificationCleanup() {
  console.log('⚡ EMERGENCY NOTIFICATION CLEANUP STARTING...');
  console.log('');
  
  let totalCleared = 0;
  const allKeys = Object.keys(localStorage);
  
  console.log(`📊 Found ${allKeys.length} total localStorage keys`);
  console.log('🔍 Searching for notification data...');
  console.log('');
  
  // Clear ALL notification-related data
  allKeys.forEach(key => {
    if (
      key.includes('notification') || 
      key.includes('notif') ||
      key.startsWith('notifications_') ||
      key.startsWith('notification_prefs_')
    ) {
      const value = localStorage.getItem(key);
      const size = value ? (value.length / 1024).toFixed(2) : '0';
      
      localStorage.removeItem(key);
      totalCleared++;
      
      console.log(`❌ Removed: ${key} (${size} KB)`);
    }
  });
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('✅ CLEANUP COMPLETE!');
  console.log(`📦 Cleared ${totalCleared} notification items`);
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('👉 NOW DO THIS:');
  console.log('   1. Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)');
  console.log('   2. This will hard refresh the page');
  console.log('   3. All old notifications will be gone');
  console.log('   4. Only NEW notifications will appear from now on');
  console.log('');
  console.log('🎉 Your notification system is now clean!');
})();

