# Clear Browser Cache to Fix Sign-In Issues

Browser cache can cause sign-in problems by serving old JavaScript files or cached Firebase authentication states.

## Quick Fix (Recommended)

### Chrome/Edge:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Select "Cookies and other site data" (optional but recommended)
4. Time range: "All time"
5. Click "Clear data"

### Firefox:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cache" and "Cookies"
3. Time range: "Everything"
4. Click "Clear Now"

### Safari:
1. Press `Cmd+Option+E` to clear cache
2. Or: Safari → Preferences → Advanced → Check "Show Develop menu"
3. Then: Develop → Empty Caches

## Hard Refresh (Faster Option)

### Windows:
- `Ctrl + Shift + R` or `Ctrl + F5`

### Mac:
- `Cmd + Shift + R`

## Clear localStorage and sessionStorage

Open browser console (F12) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Disable Cache During Development

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while testing

## After Clearing Cache

1. Close all browser tabs for `localhost:8083`
2. Restart the dev server: `npm run dev`
3. Open a new browser window
4. Navigate to `http://localhost:8083`
5. Try signing in again

## If Still Not Working

Try using an incognito/private window:
- Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- Safari: `Cmd+Shift+N`

This ensures no cached data interferes with sign-in.



