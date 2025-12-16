# 🛡️ ENQUIRY COUNT SYNCHRONIZATION - PROTECTED

## Status: ✅ PROTECTED - DO NOT MODIFY

**Date Protected**: Implemented  
**Protection Level**: MAXIMUM  
**Critical**: YES - Required for count synchronization between homescreen and Live Enquiries page

---

## 🚫 PROTECTED FILES

1. **src/pages/Landing.tsx** - Homescreen enquiry count display and logic
2. **src/pages/EnquiryWall.tsx** - Live Enquiries page count display and logic

Both files are protected in `.gitattributes` with `merge=ours` strategy.

---

## 🔒 PROTECTED CODE SECTIONS

### 1. Landing.tsx - State Declaration (Line ~188)
```typescript
// 🛡️ PROTECTED: Live enquiries count (non-expired only) - REQUIRED for matching EnquiryWall.tsx count
const [liveEnquiriesCount, setLiveEnquiriesCount] = useState(0);
```

### 2. Landing.tsx - Query Setup (Line ~800)
```typescript
// 🛡️ PROTECTED: Enquiry Loading Logic - DO NOT MODIFY
// - NO LIMIT: Must get ALL enquiries (not just first 50)
// - onSnapshot: Real-time updates matching EnquiryWall.tsx
// - Same filtering: status='live' or 'deal_closed', exclude deal_closed, exclude expired
const q = query(
  collection(db, 'enquiries'),
  orderBy('createdAt', 'desc')
  // 🛡️ NO LIMIT - must get all enquiries to match EnquiryWall.tsx count
);
```

### 3. Landing.tsx - Count Setting (Line ~894)
```typescript
// 🛡️ PROTECTED: Set live enquiries count (non-expired, non-deal-closed only)
setLiveEnquiriesCount(liveEnquiries.length);
```

### 4. Landing.tsx - Display Text (Line ~1843)
```typescript
{liveEnquiriesCount} real buyers waiting for the right seller {/* 🛡️ PROTECTED TEXT */}
```

### 5. EnquiryWall.tsx - State Declaration (Line ~58)
```typescript
// 🛡️ PROTECTED: Live enquiries count - REQUIRED for matching Landing.tsx count
const [liveEnquiriesCount, setLiveEnquiriesCount] = useState(0);
```

### 6. EnquiryWall.tsx - Count Setting (Line ~507)
```typescript
// 🛡️ PROTECTED: Set live enquiries count for display (non-expired, non-deal-closed only)
setLiveEnquiriesCount(liveEnquiries.length);
```

### 7. EnquiryWall.tsx - Display Text (Line ~1529)
```typescript
`${liveEnquiriesCount} real buyers waiting for the right seller` // 🛡️ PROTECTED TEXT
```

---

## ⚠️ CRITICAL REQUIREMENTS

### DO NOT:
- ❌ Add `limit()` to the query in Landing.tsx
- ❌ Change from `onSnapshot` to `getDocs` in Landing.tsx
- ❌ Modify the filtering logic (must match EnquiryWall.tsx exactly)
- ❌ Change the count calculation
- ❌ Change the display text format
- ❌ Remove deal_closed filtering
- ❌ Remove expired filtering

### MUST:
- ✅ Use `onSnapshot` for real-time updates (both files)
- ✅ NO LIMIT on query (get all enquiries)
- ✅ Filter: status='live' or 'deal_closed'
- ✅ Exclude: deal_closed enquiries
- ✅ Exclude: expired enquiries (same deadline handling)
- ✅ Use same deadline date handling logic
- ✅ Display: "{count} real buyers waiting for the right seller"

---

## 📋 COUNT SYNCHRONIZATION LOGIC

### Both files use identical logic:

1. **Query Setup**:
   - Collection: `enquiries`
   - OrderBy: `createdAt desc`
   - **NO LIMIT** ✅

2. **Initial Filtering**:
   - Status = 'live' OR 'deal_closed'
   - Case-insensitive check

3. **Deal Closed Exclusion**:
   - Filter out: `status === 'deal_closed'` OR `dealClosed === true`

4. **Expired Exclusion**:
   - Filter out enquiries where `deadline < now`
   - Same deadline date handling (Firestore Timestamp, Date object, string/number)

5. **Count Calculation**:
   - Count only non-expired, non-deal-closed live enquiries
   - Set to `liveEnquiriesCount` state

6. **Display**:
   - Format: `"{count} real buyers waiting for the right seller"`

---

## 🔍 VERIFICATION

To verify counts match:

1. **Check Console Logs**:
   - Landing.tsx: `📊 Landing: Live enquiries (not expired, not deal_closed): X`
   - EnquiryWall.tsx: `📊 EnquiryWall: Live enquiries (not expired): X`
   - Both should show the same number

2. **Check Display**:
   - Homescreen: Should show same count as Live Enquiries page
   - Both should show: "{count} real buyers waiting for the right seller"

3. **Check Query**:
   - Landing.tsx query should have NO `limit()`
   - Both should use `onSnapshot` (not `getDocs`)

---

## 🛡️ PROTECTION MECHANISMS

1. **Git Attributes**: `merge=ours` strategy prevents automatic overwrites
2. **Code Comments**: `🛡️ PROTECTED` markers in code
3. **Documentation**: This file documents the protection
4. **Git Hooks**: Pre-merge, pre-pull hooks block protected file changes

---

## 📝 CHANGE LOG

- **Initial Fix**: Removed limit(50), matched filtering logic
- **Syntax Fix**: Corrected onSnapshot callback structure
- **Cleanup Fix**: Proper useEffect cleanup function
- **Protection Added**: Added to `.gitattributes` and marked with protection comments
- **Status**: ✅ PROTECTED - Will not be automatically reversed

---

**🛡️ THIS FIX IS PROTECTED AND WILL NOT BE AUTOMATICALLY REVERSED**

