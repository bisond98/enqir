# Enqir Project - Comprehensive Overview

## Project Structure

### Technology Stack
- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.1
- **Styling**: Tailwind CSS 3.4.11
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **Routing**: React Router DOM 6.26.2
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Payment**: Razorpay integration
- **Image Upload**: Cloudinary
- **AI Services**: Custom AI processing for enquiry/response approval

### Development Server
- **Port**: 8083 (configured in `vite.config.ts`)
- **Localhost URL**: http://localhost:8083
- **Backend Server**: Port 5001 (Express server for Razorpay)

## Key Architecture Components

### 1. Context Providers (`src/contexts/`)
- **AuthContext**: User authentication, profile verification status (real-time)
- **NotificationContext**: Notification management
- **UsageContext**: Usage tracking for enquiries/responses
- **ConditionalAuthProvider**: Conditional authentication wrapper

### 2. Pages (`src/pages/`)
- **Landing.tsx**: Homepage with search and category browsing
- **Dashboard.tsx**: User dashboard with enquiries and responses
- **PostEnquiry.tsx**: Form to create new enquiries (buyers)
- **SellerResponse.tsx**: Form to respond to enquiries (sellers)
- **Profile.tsx**: User profile with trust badge verification
- **EnquiryWall.tsx**: Browse all live enquiries
- **EnquiryDetail.tsx**: Detailed view of a single enquiry
- **MyEnquiries.tsx**: User's own enquiries
- **MyResponses.tsx**: User's seller responses

### 3. Services (`src/services/`)
- **ai/**: AI processing services for automated approval
  - `realtimeAI.ts`: Real-time AI processing for enquiries/responses
  - `idVerification.ts`: ID number verification from uploaded images
- **paymentService.ts**: Razorpay payment processing

### 4. Components (`src/components/`)
- **LoadingAnimation.tsx**: Custom loading animation with business model visualization
- **VerificationStatus.tsx**: Trust badge verification status display
- **PaymentPlanSelector.tsx**: Payment plan selection component
- **Layout.tsx**: Main layout wrapper with navigation

## Recent Updates & Design Patterns

### Trust Badge System

#### Trust Badge Card Structure
The trust badge card appears in three locations with consistent design:
1. **Profile Page** (`src/pages/Profile.tsx`)
2. **Seller Response Form** (`src/pages/SellerResponse.tsx`)
3. **Enquiry Form** (`src/pages/PostEnquiry.tsx` - ID Verification section)

#### Current Styling Pattern (SellerResponse)
```tsx
<div className="relative space-y-4 sm:space-y-5 p-4 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-50 to-white border-2 border-black rounded-xl w-full max-w-full overflow-visible">
```

#### Key Features
- **Loading Animation**: Distorted blue tick animation during verification
- **Countdown Timer**: 60-second countdown during ID verification
- **ID Upload**: Front/back ID image upload with validation
- **Mobile Optimization**: Responsive padding (`p-4 sm:p-8 lg:p-10`)
- **Scroll Behavior**: Auto-scroll to verification section on mobile

### Mobile Responsiveness Patterns

#### Container Padding
- **Mobile**: `px-1` (minimal padding for maximum width)
- **Tablet**: `px-4 sm:px-6`
- **Desktop**: `lg:px-8`

#### Trust Badge Card Padding
- **Mobile**: `p-4`
- **Tablet**: `sm:p-8`
- **Desktop**: `lg:p-10`

### Recent Design Updates

1. **Trust Badge Card**
   - Changed "Blue tick" to "Blue Badge" text
   - Removed image preview, showing only "Image uploaded" text
   - Black borders for upload/camera buttons
   - Hide upload/camera buttons when image is uploaded
   - Black notification background (was green)

2. **Loading Animation**
   - Distorted blue tick that moves around the card
   - Bright and bold styling with glow effects
   - Countdown timer with inline verification display
   - Auto-scroll to verification section on mobile

3. **Mobile Optimizations**
   - Reduced container padding (`px-1` for mobile)
   - Scroll behavior for verification countdown
   - Native mobile file picker (removed `capture="environment"`)

4. **Category Selection**
   - Thicker borders (`border-2`) with darker color (`border-gray-400`)
   - Spacing between category items (`mb-2 last:mb-0`)

## Payment Plans

### Current Plans (`src/config/paymentPlans.ts`)
- **Free**: ₹0 - 2 responses
- **Basic**: ₹99 - 5 responses
- **Standard**: ₹199 - 10 responses
- **Premium**: ₹499 - Unlimited responses (Popular)

### Payment Flow
1. User selects plan during enquiry creation
2. Razorpay payment gateway integration
3. Payment verification via backend (`server.js`)
4. Enquiry automatically upgraded to premium status

## Trust Badge Verification Flow

### Profile-Level Verification
- User uploads ID in Profile page
- ID number verification via OCR
- Admin approval
- Status stored in `userProfiles` collection
- Applies to all enquiries/responses

### Enquiry/Response-Level Verification
- Optional ID upload during enquiry/response creation
- Verification for that specific enquiry/response only
- Does not affect profile-level verification

### Verification States
- `pending`: Awaiting verification
- `approved`: Verified and active
- `rejected`: Verification failed
- `verified`: Successfully verified

## File Upload System

### Cloudinary Integration
- **Profile Images**: `uploadToCloudinary()` - signed upload
- **ID Documents**: `uploadToCloudinaryUnsigned()` - unsigned upload
- **Reference Images**: Multiple image upload support

### Upload States
- Progress tracking with percentage display
- Loading states during upload
- Error handling and retry logic

## AI Processing System

### Real-time AI (`src/services/ai/realtimeAI.ts`)
- Automated enquiry approval
- Automated response approval
- Content analysis and filtering
- Real-time status updates via Firestore listeners

### Processing States
- `live`: Auto-approved and live
- `pending`: Under AI review
- `rejected`: Auto-rejected by AI
- `flagged`: Requires manual admin review

## Styling Conventions

### Color Scheme
- **Primary**: Black (`border-black`, `bg-black`)
- **Success**: Green (`bg-green-500`, `text-green-600`)
- **Trust Badge**: Blue (`text-blue-600`, `bg-blue-500`)
- **Background**: Gradient (`from-slate-50 via-white to-slate-50`)

### Typography
- **Headings**: `font-black tracking-tighter` (ultra-bold, tight tracking)
- **Body**: `text-sm sm:text-base` (responsive sizing)
- **Labels**: `text-xs sm:text-sm font-semibold`

### Border Patterns
- **Cards**: `border-2 border-black` or `border-4 border-black`
- **Inputs**: `border-4 border-black`
- **Trust Badge Card**: `border-2 border-black`

## Key State Management Patterns

### Real-time Data
- Firestore `onSnapshot` listeners for live updates
- Profile verification status updates in real-time
- Enquiry/response status tracking

### Form State
- Controlled components with `useState`
- Validation on change/blur
- Error state management

## Mobile-Specific Features

### Touch Optimization
- `min-touch` class for minimum touch target size (44px)
- `touch-manipulation` for better touch response
- Native file picker for mobile devices

### Scroll Behavior
- Auto-scroll to verification sections
- Smooth scrolling with `scrollIntoView`
- Mobile viewport handling

## Deployment

### Build Process
```bash
npm run build  # Production build
npm run dev    # Development server (port 8083)
```

### Environment Variables
- Firebase configuration
- Razorpay keys
- Cloudinary credentials

## Common Issues & Solutions

### Trust Badge Card Width
- **Issue**: Space around trust badge card on mobile
- **Solution**: Reduce container padding (`px-1` for mobile) or adjust card margins

### File Upload on Mobile
- **Issue**: Camera opens directly instead of showing options
- **Solution**: Remove `capture="environment"` attribute from file inputs

### Verification Countdown
- **Issue**: Countdown not visible on mobile
- **Solution**: Auto-scroll to verification section using `useRef` and `scrollIntoView`

## Next Steps for Development

1. **Trust Badge Card Width**: Make the trust badge card wider in PostEnquiry form (reduce padding/margins)
2. **Consistency**: Ensure all trust badge cards have matching dimensions across pages
3. **Mobile Optimization**: Continue refining mobile experience
4. **Performance**: Optimize image uploads and AI processing

## File Locations Reference

- **Trust Badge Card (Profile)**: `src/pages/Profile.tsx` ~line 812
- **Trust Badge Card (Seller)**: `src/pages/SellerResponse.tsx` ~line 1712
- **ID Verification (Enquiry)**: `src/pages/PostEnquiry.tsx` ~line 2046
- **Loading Animation**: `src/components/LoadingAnimation.tsx`
- **CSS Animations**: `src/index.css` ~line 34+
- **Payment Plans**: `src/config/paymentPlans.ts`
- **Auth Context**: `src/contexts/AuthContext.tsx`
- **AI Services**: `src/services/ai/realtimeAI.ts`

