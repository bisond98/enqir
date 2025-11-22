import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Hook to check if notifications are enabled for the current user
 * Returns true if notifications are enabled, false otherwise
 * Defaults to true if preference is not set
 */
export function useNotificationPreference(): boolean {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const checkPreference = async () => {
      if (!user?.uid) {
        setNotificationsEnabled(true); // Default to enabled if no user
        return;
      }

      try {
        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          // Default to true if not set (backwards compatibility)
          setNotificationsEnabled(data.notificationsEnabled !== false);
        } else {
          setNotificationsEnabled(true); // Default to enabled if profile doesn't exist
        }
      } catch (error) {
        console.error('Failed to check notification preference:', error);
        setNotificationsEnabled(true); // Default to enabled on error
      }
    };

    checkPreference();

    // Set up a listener to check preference periodically (every 5 seconds)
    // This ensures the preference is updated when changed in settings
    const interval = setInterval(checkPreference, 5000);

    return () => clearInterval(interval);
  }, [user?.uid]);

  return notificationsEnabled;
}

