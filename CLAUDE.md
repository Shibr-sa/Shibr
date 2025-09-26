# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` - Start both Next.js (http://localhost:3000) and Convex dev servers concurrently
- `bun run build` - Build production bundle (runs `bunx convex codegen` then `next build`)
- `bun start` - Start production server
- `bun run lint` - Run Next.js linter
- `bunx convex codegen --typecheck disable` - Generate TypeScript types from Convex schema

### Testing & Debugging
- `bunx convex run <function> <args>` - Run Convex functions directly (e.g., `bunx convex run users:getCurrentUserWithProfile {}`)
- `bunx convex logs` - View real-time Convex function logs
- `CONVEX_DEPLOYMENT=prod:enchanted-clam-269 bunx convex run <function>` - Run functions against production
- `CONVEX_DEPLOYMENT=dev:warmhearted-capybara-335 bunx convex run <function>` - Run functions against development

### Database (Convex)
- `bunx convex dev` - Start Convex dev server independently
- `bunx convex deploy -y` - Deploy to production (auto-confirm)
- `bunx convex env set <KEY> <VALUE>` - Set environment variables in Convex
- Dashboard: https://dashboard.convex.dev

### Package Management
This project uses Bun. Install dependencies with `bun install`.

## Architecture Overview

### Project Context
شبر (Shibr) is a B2B marketplace platform connecting physical stores with online brands through a shelf rental system in Saudi Arabia. Physical stores monetize unused shelf space while online brands gain physical retail presence.

### Core Business Logic

#### Authentication Flow (Verify-Before-Create Pattern)
1. **Signup**: User data stored in sessionStorage → Email OTP sent → Verify OTP → Create account & profile
2. **Password Reset**: Uses Convex Auth's built-in OTP system via `authPasswordReset.ts`
3. **Email Provider**: Resend API with `noreply@shibr.io` domain

#### User Journey
1. Users sign up selecting role (store owner or brand owner)
2. Store owners list shelves with location, size, and pricing
3. Brand owners browse marketplace and request rentals
4. Real-time chat between parties
5. Store owners approve/reject requests
6. Payment processing via Tap Payment Gateway
7. Approved rentals become active contracts with QR-enabled stores

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun (package management and scripts)
- **Language**: TypeScript with strict mode
- **Database**: Convex (real-time, reactive backend with WebSocket sync)
- **Authentication**: Convex Auth (password-based with OTP verification)
- **Email**: Resend API
- **Payments**: Tap Payment Gateway integration
- **UI Components**: 52 shadcn/ui components (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form + Zod validation
- **Maps**: Google Maps API (for location selection)
- **i18n**: Custom context-based implementation
- **QR Codes**: react-qr-code for store generation

### Route Structure & User Roles

Three distinct user types with role-based access control:

1. **Admin Dashboard** (`/admin-dashboard/*`)
   - User management
   - Platform settings
   - Analytics and metrics
   - Content moderation

2. **Brand Dashboard** (`/brand-dashboard/*`)
   - Browse marketplace
   - Manage rental requests
   - Product inventory
   - Performance metrics

3. **Store Dashboard** (`/store-dashboard/*`)
   - Shelf management
   - Request approval
   - Revenue tracking
   - Store settings

**Public Routes**:
- `/` - Landing page
- `/marketplace` - Public shelf listings
- `/signin`, `/signup`, `/verify-email` - Authentication flow
- `/forgot-password`, `/reset-password` - Password recovery
- `/store/[slug]/*` - QR store customer interface for active rentals

### Convex Database Schema

#### Core Tables
- **users** - Convex Auth managed user accounts
- **authAccounts** - Authentication providers (password)
- **authSessions** - Active user sessions
- **storeProfiles** - Physical store details (name, location, phone)
- **brandProfiles** - Brand details (name, website, category)
- **adminProfiles** - Admin user profiles

#### Business Tables
- **shelves** - Marketplace listings
  - Location (city, area, coordinates)
  - Dimensions and pricing
  - Availability status
  - Multiple indexes for search optimization
- **rentalRequests** - Booking workflow
  - Status: pending → payment_pending → active → completed/cancelled
  - Selected products
  - Commission rates
  - Tap payment integration
- **products** - Brand inventory with images
- **conversations/messages** - Real-time chat with read receipts
- **notifications** - User alerts for requests, messages
- **payments** - Transaction records with Tap gateway references
- **platformSettings** - Global configuration (fees, terms)
- **shelfStores** - QR-enabled stores for active rentals
- **customerOrders** - Orders from QR store customers
- **bankAccounts** - Store owner payout information

#### Email Verification
- **emailVerificationOTP** - Temporary OTP storage for signup only

### Authentication System

#### Signup Flow (Verify-Before-Create)
1. User fills form → Data stored in `sessionStorage`
2. `sendSignupOTP` mutation sends 6-digit code
3. User enters OTP on `/verify-email`
4. `verifySignupAndCreateAccount` creates account after verification
5. Auto-signin and redirect to appropriate dashboard

#### Password Reset (Convex Auth OTP)
1. Uses Convex Auth's built-in password reset provider
2. Configured in `authPasswordReset.ts` with Resend
3. 6-digit OTP valid for 10 minutes
4. Auto-redirects to dashboard after reset

### Internationalization (Critical)

The app is fully bilingual with RTL/LTR support:

#### Implementation
- Context: `/contexts/localization-context.tsx` (500+ translation keys)
- Hook: `const { t, language, direction } = useLanguage()`
- Storage: Language preference in localStorage

#### Critical Rules
- **ALL text must use translation keys** - NEVER hardcode strings
- **Every key needs both languages**: `"key": { en: "English", ar: "العربية" }`
- **Direction-aware styling**: Use `direction` for RTL/LTR layouts
- **Font switching**: `${direction === "rtl" ? "font-cairo" : "font-inter"}`
- **Number formatting**: ALWAYS English numerals (0-9), use `formatters.ts`
- **Date system**: Gregorian calendar only
- **Phone numbers**: Saudi format validation (05XXXXXXXX)

### shadcn/ui Component Usage

#### Before Implementation
1. Check documentation: https://ui.shadcn.com/docs/components/
2. Verify component exists in `/components/ui/`
3. Copy exact patterns from docs
4. Use `cn()` utility for className merging

#### Rules
- NEVER modify files in `/components/ui/` - they're library code
- NEVER create custom components if shadcn/ui equivalent exists
- ALWAYS follow shadcn patterns for consistency
- Use component composition over customization

### Real-time Features

#### Convex Reactivity
- All queries are reactive by default
- Use `useQuery` for real-time data
- Mutations trigger automatic UI updates
- WebSocket connection handles sync

#### Chat System
- Conversations linked to rental requests
- Real-time message delivery
- Read receipts
- Typing indicators (if implemented)

### Performance Patterns

- **Search**: Server-side with debouncing (300ms)
- **Pagination**: Backend pagination (10 items default)
- **Loading**: Skeletons on initial load, preserve data during updates
- **Images**: Convex file storage with URL generation
- **Caching**: Convex handles query caching automatically

### Form Patterns

- Validation: Zod schemas in `/lib/validations.ts`
- State: React Hook Form with `useForm`
- Errors: Field-level validation on blur
- Submission: Optimistic updates where appropriate

### RTL/LTR Support

- Logical properties: `ps-*`, `pe-*`, `ms-*`, `me-*`
- Avoid physical: `pl-*`, `pr-*`, `ml-*`, `mr-*`
- Spacing: Use `gap-*` over `space-x-*`
- Modifiers: Tailwind's `rtl:` and `ltr:` prefixes

### Environment Variables

#### Required in `.env.local`
```
NEXT_PUBLIC_CONVEX_URL=<convex-deployment-url>
CONVEX_DEPLOYMENT=<deployment-name>
RESEND_API_KEY=<resend-api-key>
SITE_URL=<production-url>
JWT_PRIVATE_KEY=<auth-private-key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<maps-key>
NEXT_PUBLIC_TAP_PUBLISHABLE_KEY=<tap-public-key>
```

#### Convex Environment (set via CLI)
```
RESEND_API_KEY=<resend-api-key>
SITE_URL=<production-url>
JWT_PRIVATE_KEY=<auth-private-key>
TAP_SECRET_KEY=<tap-secret-key>
```

### Deployment

#### Production Deployments
- Main branch: `master`
- Development branch: `development`
- Production Convex: `prod:enchanted-clam-269`
- Development Convex: `dev:warmhearted-capybara-335`

#### Deployment Process
1. Merge to master
2. `bunx convex deploy -y`
3. `bun run build`
4. Deploy Next.js app to hosting

### Common Patterns

#### API Calls
```typescript
// Query with real-time updates
const data = useQuery(api.shelves.getAvailable, { city: "Riyadh" })

// Mutation
const createShelf = useMutation(api.shelves.create)
await createShelf({ ...shelfData })
```

#### Translation Usage
```typescript
const { t } = useLanguage()
return <h1>{t("dashboard.welcome")}</h1>
```

#### Protected Routes
```typescript
// Middleware handles auth redirects
// Check user role in components
const { userWithProfile } = useCurrentUser()
if (userWithProfile?.accountType !== "store_owner") {
  redirect("/")
}
```

### Important Files

- `/convex/schema.ts` - Database schema definition
- `/convex/auth.ts` - Authentication configuration
- `/contexts/localization-context.tsx` - All translations
- `/lib/formatters.ts` - Number/date/currency formatting
- `/lib/validations.ts` - Zod validation schemas
- `/lib/constants.ts` - App-wide constants
- `/middleware.ts` - Route protection logic

### Code Standards

- TypeScript: Strict mode, avoid `any`
- Components: Functional only, one per file
- Hooks: Prefix with `use`
- Imports: Clean up unused
- Console: Remove `console.log` before production
- Commits: Conventional format (feat:, fix:, etc.)