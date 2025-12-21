# 🛡️ FINALIZED SEARCH LOGIC - DO NOT MODIFY

## Overview
This document describes the **FINALIZED** search logic system that connects the Homescreen (Landing page) and Live Enquiries page. **Any modifications to this system must be carefully coordinated and tested.**

---

## 🔍 Search Flow Architecture

### 1. Homescreen Search (Landing.tsx)
**Location:** `src/pages/Landing.tsx`
**Protected Sections:**
- `keywordToCategory` mapping (line ~294)
- `handleSearch()` function (line ~370)

**How it works:**
1. User types search term in homescreen
2. System checks if search term matches a keyword in `keywordToCategory` map
3. **If keyword match:** Redirects to `/enquiries?category={matchedCategory}`
4. **If no match:** Redirects to `/enquiries?search={searchTerm}`
5. Saves search to recent searches (localStorage, max 5)

**⚠️ CRITICAL:** The keyword-to-category mapping must remain consistent. Any changes here affect how users are routed to categories.

---

### 2. Live Enquiries Search (EnquiryWall.tsx)
**Location:** `src/pages/EnquiryWall.tsx`
**Protected Sections:**
- `finalResults` useMemo (line ~940) - Search prioritization logic
- `displayEnquiries` useMemo (line ~1277) - Order preservation when search active
- Shuffling interval (line ~1219) - Pause logic when search active

**How it works:**

#### Search Prioritization (When Search Active):
1. **Title matches** get highest priority (score: 10000 in selected category, 5000 in others)
2. **Description matches** get medium priority (score: 1000 in selected category, 500 in others)
3. **AI results** get lowest priority (score: 100 in selected category, 50 in others)

#### Category-Aware Sorting:
- Within each match type, **selected category matches appear before other categories**
- Example order:
  1. Title matches in selected category
  2. Title matches from other categories
  3. Description matches in selected category
  4. Description matches from other categories
  5. AI results in selected category
  6. AI results from other categories

#### Order Preservation:
- When search is active, shuffling is **paused** to preserve priority order
- Results maintain their priority order through the display pipeline
- Order map is created from `filteredEnquiries` to preserve search priority

**⚠️ CRITICAL:** The scoring system and order preservation logic must not be modified. Changing scores or removing order preservation will break search prioritization.

---

## 🔗 Integration Points

### URL Parameters:
- `?category={category}` - Filters by category (from keyword match)
- `?search={term}` - Activates search prioritization (from general search)

### State Flow:
1. Landing page reads URL params on mount
2. Sets `selectedCategory` or `searchTerm` accordingly
3. EnquiryWall applies filters and prioritization

---

## ⚠️ Protection Markers

All critical sections are marked with:
- `🛡️ PROTECTED: FINALIZED SEARCH LOGIC - DO NOT MODIFY`
- `⚠️ CRITICAL:` warnings explaining why changes are dangerous

**DO NOT:**
- Modify the scoring system without understanding the priority order
- Remove shuffling pause logic when search is active
- Change keyword-to-category mapping without updating both pages
- Modify order preservation logic in `displayEnquiries`

---

## 🧪 Testing Checklist

Before making ANY changes to search logic, verify:
- [ ] Title matches appear before description matches
- [ ] Selected category matches appear before other categories
- [ ] Shuffling pauses when search is active
- [ ] Keyword searches redirect to correct categories
- [ ] General searches show results in priority order
- [ ] Recent searches are saved and displayed correctly

---

## 📝 Change Protocol

If changes are absolutely necessary:
1. **Document** why the change is needed
2. **Test** both homescreen and Live Enquiries flows
3. **Update** this documentation file
4. **Coordinate** changes across both Landing.tsx and EnquiryWall.tsx
5. **Verify** search prioritization still works correctly

---

## 🎯 Finalized Date
**Date:** 2024 (Current Implementation)
**Status:** ✅ FINALIZED - Production Ready

---

**Remember:** This search system is the result of careful prioritization logic. Breaking it will degrade user experience significantly.

