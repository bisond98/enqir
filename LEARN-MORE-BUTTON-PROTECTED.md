# 🛡️ Learn More Button - PROTECTED - DO NOT REVERT

## ⚠️ CRITICAL: THIS BUTTON IS PROTECTED

**Status**: ✅ FINALIZED - STABLE - PROTECTED  
**Date**: Protected  
**File**: `src/pages/Landing.tsx`  
**Protection**: Active via `.gitattributes` with `merge=ours`

## 🚫 IMPORTANT RULES

1. **DO NOT** automatically reverse any changes to this button
2. **DO NOT** modify without explicit user permission
3. **DO NOT** allow merges/pulls to overwrite these changes
4. **ASK PERMISSION** before making any changes to this button

## 📋 Current Implementation

### Mobile (PROTECTED):
- **Position**: Fixed at bottom left (`fixed bottom-6 left-6`)
- **Size**: `w-24 h-24` (96px × 96px) - **DO NOT CHANGE**
- **Icon**: Plus icon `h-10 w-10`
- **Z-index**: `z-50` (stays on top)
- **Visibility**: `sm:hidden` (mobile only)

### Desktop:
- **Position**: Centered in card
- **Size**: `w-14 h-14` (56px × 56px)
- **Icon**: Plus icon `h-6 w-6`
- **Visibility**: `hidden sm:inline-flex` (desktop only)

## 📍 Exact Code Location

**File**: `src/pages/Landing.tsx`
**Lines**: ~2936-2949 (Mobile button)
**Lines**: ~2950-2963 (Desktop button)

## 🔒 Protection Status

✅ **File Protected**: `src/pages/Landing.tsx` is in `.gitattributes` with `merge=ours`
✅ **Git Hooks Active**: Pre-merge, post-merge, and pre-pull hooks protect against auto-reversion
✅ **Code Markers**: Protected comments in code
✅ **Documentation**: This file serves as permanent record

## 🚫 What NOT to Do

1. ❌ **DO NOT** change button size on mobile (must stay `w-24 h-24`)
2. ❌ **DO NOT** change button position on mobile (must stay `bottom-6 left-6`)
3. ❌ **DO NOT** remove the Plus icon
4. ❌ **DO NOT** change it back to text "Learn More"
5. ❌ **DO NOT** change it back to rectangular shape
6. ❌ **DO NOT** allow automatic merges to overwrite these changes
7. ❌ **DO NOT** modify without asking user permission first

## ✅ Change Protocol

**Before making ANY changes to this button:**

1. **ASK USER PERMISSION** explicitly
2. **EXPLAIN** what will be changed and why
3. **WAIT** for user approval
4. **DOCUMENT** any approved changes in this file
5. **VERIFY** protection is still active after changes

## 📝 Verification

To verify the button is in place:

```bash
# Check button size (should be w-24 h-24 for mobile)
grep -n "w-24 h-24" src/pages/Landing.tsx

# Check button position (should be bottom-6 left-6)
grep -n "bottom-6 left-6" src/pages/Landing.tsx

# Check Plus icon
grep -n "Plus className" src/pages/Landing.tsx
```

## 🔄 Related Files

- `src/pages/Landing.tsx` - Contains the button implementation
- `.gitattributes` - Contains protection rules
- `src/App.tsx` - Contains `/help-guide` route

## 📝 Last Updated

**Date**: Protected - STABLE - DO NOT MODIFY WITHOUT PERMISSION  
**Status**: ✅ PROTECTED - This button configuration is FINALIZED

---

**🛡️ This button is PROTECTED, STABLE, and FINALIZED. DO NOT modify without explicit user permission.**

