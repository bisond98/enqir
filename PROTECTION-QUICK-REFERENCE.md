# 🛡️ PROTECTION QUICK REFERENCE

## ⚠️ BEFORE ANY UPDATE - READ THIS

### 🚫 NEVER CHANGE:
1. **Count Calculation Logic** - `Landing.tsx`, `EnquiryWall.tsx`
2. **Trust Badge Logic** - `PostEnquiry.tsx`, `Landing.tsx`
3. **Pagination Logic** - `EnquiryWall.tsx`
4. **Robot Animation Logic** - `SignIn.tsx`, `HelpGuide.tsx`
5. **Firestore Query Logic** - All pages
6. **Authentication Logic** - `AuthContext.tsx`, `App.tsx`
7. **Chat Logic** - `MyChats.tsx`, `AllChats.tsx`, `ChatContext.tsx`

### ✅ SAFE TO CHANGE:
- Colors, fonts, sizes, spacing
- Visual styling, borders, shadows
- Static text content
- Layout positioning
- CSS classes

---

## 📋 Protection Status

✅ **Git Attributes**: Active (`.gitattributes`)
✅ **Git Hooks**: Active (`pre-merge`, `pre-pull`)
✅ **Code Comments**: Active (🛡️ PROTECTED markers)
✅ **Protection Guide**: See `UPDATE-PROTECTION-GUIDE.md`

---

## 🔍 How to Check Before Updating

1. **Search for protection markers**:
   ```bash
   grep -r "🛡️ PROTECTED\|⚠️ CRITICAL\|DO NOT MODIFY" src/pages/
   ```

2. **Read the full guide**:
   - See `UPDATE-PROTECTION-GUIDE.md` for detailed instructions

3. **Test after changes**:
   - Verify counts are accurate
   - Verify trust badges work
   - Verify pagination works
   - Test on mobile and desktop

---

## 🚨 If You See Protection Comments

**STOP** and review:
- `🛡️ PROTECTED` = Do not modify
- `⚠️ CRITICAL` = Critical logic, do not change
- `DO NOT MODIFY` = Explicit protection
- `🚀 FIX` = Important fix, do not revert

---

**For detailed information, see**: `UPDATE-PROTECTION-GUIDE.md`

