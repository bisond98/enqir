/**
 * Clear All Notifications Script
 * Run this in browser console to clear all notifications for all users
 */

// Clear all notification-related localStorage keys
function clearAllNotifications() {
  console.log('🧹 Starting notification cleanup...');
  
  let count = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.includes('notification') || 
        key.includes('notif') || 
        key.includes('pal_notif') ||
        key.startsWith('notif_')) {
      localStorage.removeItem(key);
      count++;
      console.log('Removed:', key);
    }
  });
  
  console.log(`✅ Cleared ${count} notification items from localStorage`);
  console.log('Please refresh the page to start fresh.');
}

// Run the cleanup
clearAllNotifications();

