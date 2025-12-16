# Trust Badge Fix - PostEnquiry Form

## Issue
The Post Enquiry form trust badge was not showing badges in enquiry cards when ID images were uploaded through the form.

## Root Cause
The `PostEnquiry.tsx` form was setting `userVerified` and `isProfileVerified` fields, but was missing the `userProfileVerified` field that the trust badge condition in `Landing.tsx` checks for.

## Fix Applied
Added `userProfileVerified` field to the enquiry data in `PostEnquiry.tsx`:

1. **When user is verified** (line 1395):
   ```typescript
   userProfileVerified: isUserVerified
   ```

2. **When ID images are uploaded** (line 1409):
   ```typescript
   enquiryData.userProfileVerified = true;
   ```

## Trust Badge Condition (Landing.tsx)
The trust badge displays when ANY of these conditions are true:
- `userProfiles[enquiry.userId]?.isProfileVerified`
- `userProfiles[enquiry.userId]?.isVerified`
- `userProfiles[enquiry.userId]?.trustBadge`
- `userProfiles[enquiry.userId]?.isIdentityVerified`
- `enquiry.userProfileVerified` ✅ (Now being set)
- `enquiry.isProfileVerified`
- `enquiry.userVerified`
- `enquiry.idFrontImage`
- `enquiry.idBackImage`

## Status
✅ Fixed and pushed live

