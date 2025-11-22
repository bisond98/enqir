import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"
import { auth } from "@/firebase"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

// Store notification preference in memory for quick access
let notificationPreferenceCache: { userId: string | null; enabled: boolean; timestamp: number } = {
  userId: null,
  enabled: true,
  timestamp: 0
};

// Cache duration: 5 seconds
const CACHE_DURATION = 5000;

/**
 * Check if notifications are enabled for the current user
 * Uses cached value for performance
 */
async function checkNotificationPreference(userId: string | null): Promise<boolean> {
  if (!userId) {
    return true; // Default to enabled if no user
  }

  // Check cache first
  const now = Date.now();
  if (
    notificationPreferenceCache.userId === userId &&
    (now - notificationPreferenceCache.timestamp) < CACHE_DURATION
  ) {
    return notificationPreferenceCache.enabled;
  }

  // Check localStorage for quick access
  try {
    const cachedPreference = localStorage.getItem(`notification_preference_${userId}`);
    if (cachedPreference) {
      const parsed = JSON.parse(cachedPreference);
      if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
        notificationPreferenceCache = {
          userId,
          enabled: parsed.enabled !== false,
          timestamp: parsed.timestamp
        };
        return parsed.enabled !== false;
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // Fetch from Firestore
  try {
    const { db } = await import('@/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const profileRef = doc(db, 'userProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    let enabled = true; // Default to enabled
    if (profileDoc.exists()) {
      const data = profileDoc.data();
      enabled = data.notificationsEnabled !== false;
    }

    // Update cache
    notificationPreferenceCache = {
      userId,
      enabled,
      timestamp: now
    };

    // Update localStorage cache
    try {
      localStorage.setItem(`notification_preference_${userId}`, JSON.stringify({
        enabled,
        timestamp: now,
        userSet: false // This is from Firestore, not user-set
      }));
    } catch (e) {
      // Ignore localStorage errors
    }

    return enabled;
  } catch (error) {
    console.error('Failed to check notification preference:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Update notification preference cache (called from Settings page)
 */
export function updateNotificationPreferenceCache(userId: string | null, enabled: boolean) {
  const now = Date.now();
  notificationPreferenceCache = {
    userId,
    enabled,
    timestamp: now
  };

  if (userId) {
    try {
      // Store in localStorage with a long timestamp to ensure it's always checked
      // Use a very long duration (1 year) so disabled state persists
      localStorage.setItem(`notification_preference_${userId}`, JSON.stringify({
        enabled,
        timestamp: now,
        // Add a flag to indicate this is a user-set preference (not just cached)
        userSet: true
      }));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// Get current user ID from auth context (if available)
function getCurrentUserId(): string | null {
  try {
    // Method 1: Try to get from Firebase auth directly (most reliable and synchronous)
    if (auth && auth.currentUser && auth.currentUser.uid) {
      return auth.currentUser.uid;
    }
    
    // Method 2: Check if auth state is stored in localStorage (synchronous fallback)
    try {
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.uid) return parsed.uid;
      }
    } catch (e) {
      // Ignore errors
    }
    
    // Method 3: Check Firebase auth state (if available via window)
    if (typeof window !== 'undefined' && (window as any).__FIREBASE_AUTH_USER__) {
      return (window as any).__FIREBASE_AUTH_USER__.uid;
    }
    
    // Method 4: Try to get from notification preference cache (if it has a userId)
    // This helps when the cache was set but we can't get user ID from auth
    if (notificationPreferenceCache.userId) {
      return notificationPreferenceCache.userId;
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

function toast({ ...props }: Toast & { forceShow?: boolean }) {
  // Check if this toast should be shown based on notification preferences
  // Allow forceShow to bypass the check (for critical errors, etc.)
  if (!props.forceShow) {
    const userId = getCurrentUserId();
    if (!userId) {
      // No user ID, allow toast (user not logged in)
    } else {
      const now = Date.now();
      let shouldBlock = false;
      let preferenceFound = false;
      
      // Method 1: Check in-memory cache first (fastest)
      if (
        notificationPreferenceCache.userId === userId &&
        (now - notificationPreferenceCache.timestamp) < CACHE_DURATION
      ) {
        shouldBlock = !notificationPreferenceCache.enabled;
        preferenceFound = true;
      } 
      // Method 2: Check localStorage cache
      if (!preferenceFound) {
        try {
          const cachedPreference = localStorage.getItem(`notification_preference_${userId}`);
          if (cachedPreference) {
            const parsed = JSON.parse(cachedPreference);
            // If user explicitly set it to disabled, always respect it (regardless of timestamp)
            if (parsed.userSet && parsed.enabled === false) {
              shouldBlock = true;
              preferenceFound = true;
              // Update in-memory cache
              notificationPreferenceCache = {
                userId,
                enabled: false,
                timestamp: parsed.timestamp || now
              };
            }
            // Otherwise check if cache is valid (within duration)
            else if (parsed.timestamp && (now - parsed.timestamp) < CACHE_DURATION) {
              shouldBlock = parsed.enabled === false;
              preferenceFound = true;
              // Update in-memory cache
              notificationPreferenceCache = {
                userId,
                enabled: !shouldBlock,
                timestamp: parsed.timestamp
              };
            }
            // If cache exists but expired and it was disabled, still respect it
            else if (parsed.enabled === false && parsed.userSet) {
              shouldBlock = true;
              preferenceFound = true;
              // Update in-memory cache with current timestamp
              notificationPreferenceCache = {
                userId,
                enabled: false,
                timestamp: now
              };
            }
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      // If we found that notifications are disabled, block the toast immediately
      if (shouldBlock) {
        return {
          id: '',
          dismiss: () => {},
          update: () => {},
        };
      }
      
      // If cache is missing/expired, check Firestore synchronously if possible
      // For now, if we can't find the preference, we'll check Firestore in background
      // but we should also check if there's a recent preference stored
      if (!preferenceFound) {
        // Check Firestore asynchronously and update cache
        checkNotificationPreference(userId).then((enabled) => {
          updateNotificationPreferenceCache(userId, enabled);
          // If disabled, we can't block this toast (already shown), but future ones will be blocked
        }).catch(() => {
          // On error, default to enabled (show toasts) for this instance
        });
      }
    }
  }

  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  const toastDuration = props.duration !== undefined && props.duration !== null ? props.duration : 5000;
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      duration: toastDuration,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
