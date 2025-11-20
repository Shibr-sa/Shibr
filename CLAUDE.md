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
- `bunx convex run <function> <args>` - Run Convex functions directly
- `bunx convex logs` - View real-time Convex function logs
- `bunx convex logs --error-only` - Filter to show only errors
- `CONVEX_DEPLOYMENT=prod:enchanted-clam-269 bunx convex run <function>` - Run functions against production
- `CONVEX_DEPLOYMENT=dev:warmhearted-capybara-335 bunx convex run <function>` - Run functions against development

#### Common Debug Commands
```bash
# Test user authentication
bunx convex run users:getCurrentUserWithProfile {}

# Check platform settings
bunx convex run platformSettings:getPlatformSettings

# Test email sending (development)
bunx convex run emailVerification:sendSignupOTP '{"email":"test@example.com"}'

# Check rental request status
bunx convex run rentalRequests:getById '{"requestId":"<id>"}'
```

### Database (Convex)
- `bunx convex dev` - Start Convex dev server independently
- `bunx convex deploy -y` - Deploy to production (auto-confirm)
- `bunx convex env set <KEY> <VALUE>` - Set environment variables in Convex
- `bunx convex env list` - List all environment variables
- `bunx convex env unset <KEY>` - Remove environment variable
- Dashboard: https://dashboard.convex.dev

### Seeding & Database Reset
- `bun seed:admin` - Seed initial super admin user (it@shibr.io)
- `bun seed` - Seed test stores without images
- `bun seed:logos` - Seed test stores with logos and images (recommended)
- `bunx convex run resetDatabase:resetAllData` - Reset entire database (development only)

### Package Management
This project uses Bun. Install dependencies with `bun install`.

**Note**: Cursor rules reference Yarn, but the project uses Bun for all operations.

## Development Workflow

### Quick Start
```bash
# Install dependencies
bun install

# Set up environment variables (see ENVIRONMENT_VARIABLES.md for complete guide)
cp .env.example .env.local
# Edit .env.local with your NEXT_PUBLIC_CONVEX_URL

# Generate and set JWT keys for authentication
node scripts/generate-jwt-keys.mjs
# Copy JWT_PRIVATE_KEY and JWKS values, then:
bunx convex env set JWT_PRIVATE_KEY -- "<paste-private-key>"
bunx convex env set JWKS "<paste-jwks>"
bunx convex env set SITE_URL "http://localhost:3000"
bunx convex env set DEV_MODE true

# Seed initial admin user
bun seed:admin

# Start development servers
bun dev
# Opens: http://localhost:3000
```

### Admin Access
- **URL**: http://localhost:3000/admin-dashboard
- **Email**: it@shibr.io
- **Password**: wwadnj0aw2nc@!!
- Create additional admins via admin dashboard after initial login

### Common Development Tasks

#### Adding a New Feature
1. Create feature branch from `development`
2. Update schema if needed: `/convex/schema.ts`
3. Run `bunx convex codegen --typecheck disable` after schema changes
4. Implement backend functions in `/convex/`
5. Create UI components (prefer Server Components)
6. Add translations to `/contexts/localization-context.tsx`
7. Test with both English and Arabic languages
8. Verify RTL layout in Arabic mode

#### Working with Forms
1. Define Zod schema in `/lib/validations.ts`
2. Use React Hook Form with zodResolver
3. Implement Server Action for submission
4. Add loading states and error handling
5. Test validation with edge cases

#### Adding New Routes
1. Create folder in appropriate dashboard (`/app/[role]-dashboard/`)
2. Add `page.tsx` (Server Component by default)
3. Add `loading.tsx` for Suspense fallback
4. Update navigation in dashboard layout
5. Add route protection if needed

## Architecture Overview

### Project Context
شبر (Shibr) is a B2B marketplace platform connecting physical stores with online brands through a shelf rental system in Saudi Arabia. Physical stores monetize unused shelf space while online brands gain physical retail presence.

### Core Business Logic

#### Authentication Flow (Verify-Before-Create Pattern)
1. **Signup**: User data stored in sessionStorage → Email OTP sent → Verify OTP → Create account & profile
2. **Password Reset**: Uses Convex Auth's built-in OTP system via `authPasswordReset.ts`
3. **Email Provider**: Resend API with `noreply@shibr.io` domain
4. **Phone Verification**: Alternative OTP system in `/convex/phoneVerification.ts` (574 lines)
5. **Session Management**: JWT-based with Convex Auth, 30-day expiry

**CRITICAL**: Admin seeding uses `createAccount` API from `@convex-dev/auth/server` in `internalAction` context (not mutations). This ensures password hashing uses Convex Auth's Scrypt algorithm, matching normal user signup flow. Never manually hash passwords with SHA-256 or insert directly into `authAccounts` table - always use the `createAccount` API.

Seeding files:
- `/convex/forceAdminSeed.ts` - Main admin seeding (recommended)
- `/convex/seedInitialAdmin.ts` - Alternative admin seeding
- `/convex/admin/settings.ts` - Contains `seedInitialSuperAdmin` action
- All use `internalAction` + `createAccount(ctx, {...})` pattern

#### Rental Workflow State Machine

**⚠️ IMPORTANT: Current implementation is incomplete. The flow below is the REQUIRED flow, but only partial implementation exists (steps 1-6 incomplete, step 7-9 exist).**

```
1. Brand Creates Request → pending_admin_approval (Admin only sees it)
                            ↓
2. Admin Reviews & Approves
   Admin Sets Platform Commission % (per request)
                            ↓
3. Admin Activates → pending (Store now sees it)
                            ↓
4. Store Accepts → payment_pending
   Store Rejects → rejected
                            ↓
5. Brand Pays (Tap Gateway) → awaiting_shipment
                            ↓
6. Brand Ships Products to Store
   Brand Fills Shipping Info → shipment_sent
                            ↓
7. Store Confirms Receipt → active (Rental period starts)
                            ↓
8. End Date Passes → completed
                            ↓
9. Clearance Process (5 steps):
   a. Admin confirms operation end → pending_clearance
   b. Inventory reconciliation (sold vs remaining)
   c. Brand ships products back to store
   d. Financial settlement (platform, store, brand commissions)
   e. Generate clearance document → closed
```

**Current Status vs Required:**
- ✅ Steps 7-8: Active rental management and automatic completion (IMPLEMENTED)
- ❌ Steps 1-3: Admin pre-approval workflow (NOT IMPLEMENTED)
- ❌ Steps 4-6: Initial shipping confirmation (NOT IMPLEMENTED)
- ❌ Step 9: Complete clearance mechanism (NOT IMPLEMENTED)

**Commission Structure:**
1. **Rental Fee Commission**: Platform takes % of monthly rental fee (set by admin per request)
2. **Sales Commission**: Platform + Store take % of product sales during rental period

#### User Journey (Required Flow)
1. Users sign up selecting role (store owner, brand owner, or admin)
2. Store owners create branches (each gets a permanent QR code) and list shelves with location, size, and pricing
3. Brand owners browse marketplace and request rentals
4. **Admin reviews request, sets platform commission, and activates it** ⚠️ NOT IMPLEMENTED
5. Store owners approve/reject requests (only see admin-approved requests)
6. Brand pays via Tap Payment Gateway with webhook confirmation
7. **Brand ships products to store and fills shipping details** ⚠️ NOT IMPLEMENTED
8. **Store confirms receipt of products** ⚠️ NOT IMPLEMENTED
9. Rental becomes active - brand products appear in the branch's QR store
10. QR store allows customers to browse products and place orders
11. When rental period ends, **clearance process begins** ⚠️ NOT IMPLEMENTED:
    - Inventory reconciliation (products sold vs remaining)
    - Brand ships unsold products back
    - Financial settlement (store gets commission from sales)
    - Clearance document generated

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
   - User management with 4-role RBAC system:
     - `super_admin`: Full system access
     - `support`: User/content management
     - `finance`: Financial operations
     - `operations`: Platform operations
   - Platform settings and configuration
   - Analytics and metrics dashboard
   - Content moderation and approval workflows
   - Implementation: `/convex/admin.ts` (1635 lines)

2. **Brand Dashboard** (`/brand-dashboard/*`)
   - Browse marketplace with filters
   - Manage rental requests and contracts
   - Product inventory with bulk upload
   - Performance metrics and analytics
   - Payout management

3. **Store Dashboard** (`/store-dashboard/*`)
   - Branch management (multiple locations)
   - Shelf listing with pricing tiers
   - Request approval workflow
   - Revenue tracking and reports
   - Bank account management for payouts
   - QR code generation for branches

**Public Routes**:
- `/` - Landing page with feature showcase
- `/marketplace` - Public shelf listings with search/filter
- `/signin`, `/signup`, `/verify-email` - Authentication flow
- `/forgot-password`, `/reset-password` - Password recovery
- `/store/[branchId]/*` - QR store customer interface (permanent URLs)
- `/terms`, `/privacy`, `/contact` - Legal pages

### Convex Database Schema

Complete schema in `/convex/schema.ts` (436 lines) with strategic indexing for performance.

#### Core Tables
- **users** - Convex Auth managed user accounts
- **authAccounts** - Authentication providers (password)
- **authSessions** - Active user sessions (30-day expiry)
- **storeProfiles** - Physical store details (name, location, phone, status)
- **brandProfiles** - Brand details (name, website, category, verification)
- **adminProfiles** - Admin user profiles with role-based permissions

#### Business Tables
- **shelves** - Marketplace listings
  - Location (city, area, coordinates)
  - Dimensions (width, height, depth in cm)
  - Pricing (monthly rate + commission %)
  - Status: available, rented, suspended
  - Indexes: by_store_and_status, by_city_and_status, by_availability
- **rentalRequests** - Booking workflow
  - Status state machine (see Rental Workflow above)
  - Selected products array
  - Commission rates (platform + store)
  - Payment references (Tap gateway)
  - Duration and pricing details
- **products** - Brand inventory
  - Multiple images support
  - Stock tracking
  - Category and tags
  - Price and discount fields
- **conversations/messages** - Real-time chat
  - Linked to rental requests
  - Read receipts tracking
  - File attachments support
- **notifications** - User alerts
  - Type-based routing
  - Read/unread status
  - Action URLs
- **payments** - Transaction records
  - Tap payment references
  - Status tracking
  - Refund support
- **platformSettings** - Global configuration
  - Commission rates
  - Terms and conditions
  - Tax settings (15% VAT)
- **branches** - Store locations
  - Permanent QR codes
  - Analytics tracking
  - Operating hours
  - Location coordinates
- **customerOrders** - QR store orders
  - Customer details
  - Order items with quantities
  - Payment status
  - Delivery/pickup options
- **bankAccounts** - Payout information
  - IBAN validation
  - Bank details
  - Verification status

#### Supporting Tables
- **emailVerificationOTP** - Temporary OTP storage (10-minute expiry)
- **phoneVerificationOTP** - Phone number verification
- **auditLogs** - Admin action tracking
- **supportTickets** - Customer support system

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

**Complete documentation**: See `ENVIRONMENT_VARIABLES.md` for detailed guide on all 20+ variables.

#### Critical Setup (Required for Development)

**Next.js Environment** (`.env.local`):
```env
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210  # Or your Convex cloud URL
CONVEX_DEPLOYMENT=local:local-hossam_eldin-shibr_37bd1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_TAP_PUBLISHABLE_KEY=pk_test_xxx
```

**Convex Environment** (set via `bunx convex env set`):
```bash
# Authentication (REQUIRED - generate with scripts/generate-jwt-keys.mjs)
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY----- ..."
JWKS={"keys":[{"use":"sig",...}]}
SITE_URL="http://localhost:3000"

# Development Mode Control (REQUIRED)
DEV_MODE=true  # Set to "true" for development, unset for production

# Email/SMS (Optional in dev, Required in production)
RESEND_API_KEY=re_xxx  # Optional - OTPs logged to console in dev mode
KARZOUN_API_TOKEN=xxx  # Optional - OTPs logged to console in dev mode
KARZOUN_SENDER_ID=xxx
KARZOUN_OTP_TEMPLATE_NAME=xxx

# Payments (Required in production)
TAP_SECRET_KEY=sk_xxx
```

#### Development vs Production OTP Behavior

**Development Mode** (`DEV_MODE=true`):
- All OTPs (email signup, phone, password reset) are **logged to console**
- No external API calls made
- No API keys required
- Perfect for testing without external services
- Console output format:
  ```
  ==================================================
  📧 SIGNUP EMAIL VERIFICATION OTP (DEV MODE)
  ==================================================
  To: user@example.com
  OTP Code: 123456
  ==================================================
  ```

**Production Mode** (`DEV_MODE` unset or not "true"):
- OTPs sent via actual email/SMS services
- Requires `RESEND_API_KEY` for emails
- Requires `KARZOUN_*` credentials for SMS/WhatsApp
- Throws errors if API keys are missing

#### First-Time Setup Script
```bash
# 1. Generate JWT keys
node scripts/generate-jwt-keys.mjs

# 2. Set all variables using template (edit first with your values)
cp convex-env-template.sh convex-env-setup.sh
# Edit convex-env-setup.sh with generated keys
chmod +x convex-env-setup.sh
./convex-env-setup.sh
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

// Mutation with error handling
const createShelf = useMutation(api.shelves.create)
try {
  await createShelf({ ...shelfData })
} catch (error) {
  logError({ error, level: 'ERROR', context: { action: 'createShelf' } })
}

// Paginated query
const { results, page, hasMore } = useQuery(api.shelves.list, {
  page: currentPage,
  limit: 10
})
```

#### Translation Usage
```typescript
const { t, language, direction } = useLanguage()
return (
  <div className={direction === "rtl" ? "font-cairo" : "font-inter"}>
    <h1>{t("dashboard.welcome")}</h1>
  </div>
)
```

#### Protected Routes
```typescript
// Middleware handles auth redirects
// Check user role in components
const { userWithProfile } = useCurrentUser()
if (userWithProfile?.accountType !== "store_owner") {
  redirect("/")
}

// Admin role checking
if (userWithProfile?.adminRole !== "super_admin") {
  return <Unauthorized />
}
```

### Key Convex Functions

#### Critical Backend Files
- `/convex/users.ts` (547 lines) - User management and profiles
- `/convex/shelves.ts` (892 lines) - Marketplace core logic
- `/convex/rentalRequests.ts` (758 lines) - Booking workflow
- `/convex/payments.ts` (428 lines) - Payment processing with Tap
- `/convex/admin.ts` (1635 lines) - Complete admin system
- `/convex/emailVerification.ts` (383 lines) - OTP system
- `/convex/branches.ts` (412 lines) - Store branch management
- `/convex/products.ts` (623 lines) - Inventory management
- `/convex/conversations.ts` (387 lines) - Real-time chat

#### Common Convex Patterns
```typescript
// Authentication check in mutations/queries
export const myFunction = mutation({
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getCurrentUser)
    if (!user) throw new Error("Unauthorized")
    // ... function logic
  }
})

// Paginated queries
export const list = query({
  args: { page: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, { page, limit = 10 }) => {
    const results = await ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("status"), "available"))
      .paginate({ numItems: limit, cursor: page })
    return results
  }
})

// Transaction with multiple operations
export const approveRequest = mutation({
  handler: async (ctx, { requestId }) => {
    // Update request status
    await ctx.db.patch(requestId, { status: "active" })
    // Create payment record
    await ctx.db.insert("payments", { ... })
    // Send notification
    await ctx.scheduler.runAfter(0, api.notifications.send, { ... })
  }
})
```

### Important Files

- `/convex/schema.ts` - Database schema definition
- `/convex/auth.ts` - Authentication configuration
- `/convex/auth.config.ts` - Auth domain configuration (uses CONVEX_SITE_URL)
- `/contexts/localization-context.tsx` - All translations
- `/lib/formatters.ts` - Number/date/currency formatting
- `/lib/validations.ts` - Zod validation schemas
- `/lib/constants.ts` - App-wide constants
- `/middleware.ts` - Route protection logic

### Utility Scripts & Documentation

- `/scripts/generate-jwt-keys.mjs` - Generate RS256 JWT key pairs for Convex Auth
- `/convex/resetDatabase.ts` - Reset all database tables (development only)
- `/ENVIRONMENT_VARIABLES.md` - Complete guide to all environment variables
- `/convex-env-template.sh` - Template script for setting all Convex env vars
- `/.env.example` - Template for Next.js environment variables

### Security Patterns

#### Content Security Policy
Configured in `/middleware.ts` with specific exemptions:
- Google Maps API for location selection
- Tap Payment Gateway for checkout
- Convex WebSocket for real-time features
- Strict CSP headers for XSS protection

#### Payment Security
- Webhook signature verification for Tap callbacks
- Server-side payment validation
- No sensitive data in client state
- Rate limiting on payment endpoints

#### Authentication Security
- JWT with 30-day expiry
- OTP rate limiting (3 attempts per 10 minutes)
- Session invalidation on password change
- Secure password requirements (8+ chars, complexity)

### Error Handling & Logging

#### Error Logger (`/lib/error-logger.ts` - 280 lines)
```typescript
// Usage example
logError({
  error,
  level: 'ERROR',
  userId: user?._id,
  context: { page: '/dashboard', action: 'loadShelves' }
})
```

Levels: DEBUG, INFO, WARN, ERROR, FATAL

#### Auth Error Handling
- Centralized auth error parsing with translation keys
- Retry logic with exponential backoff
- User-friendly error messages
- Automatic session refresh attempts

### Performance Optimizations

#### Database Indexing Strategy
- Composite indexes for common queries
- Separate indexes for status filtering
- Geographic indexes for location search
- Text indexes for search functionality

#### Query Optimization
- Batch fetching to prevent N+1 queries
- Pagination with cursor-based navigation
- Selective field projection
- Query result caching via Convex

#### Bundle Optimization
- Dynamic imports for heavy components
- Image optimization with next/image
- Route-based code splitting
- Tree shaking with proper imports

### Testing Infrastructure

**Current Status**: No automated testing configured

#### Recommended Setup
```bash
# Install testing dependencies (not currently present)
bun add -d vitest @testing-library/react @testing-library/user-event
bun add -d @vitejs/plugin-react playwright
```

#### Suggested Test Structure
```
__tests__/
├── unit/           # Utility functions, hooks
├── integration/    # API routes, Convex functions
├── e2e/           # User flows with Playwright
└── fixtures/      # Test data and mocks
```

### Non-Obvious Systems

#### Tax Calculation
- 15% VAT applied at display time, not stored in DB
- Calculated in `/lib/formatters.ts`
- Shown on all pricing displays
- Included in payment processing

#### Phone Verification System (`/convex/phoneVerification.ts`)
- Alternative to email OTP
- Saudi number format validation
- SMS provider integration ready
- 574 lines of implementation

#### Multi-Step Form System
- Shelf creation: 7-step wizard (34KB component)
- Progress persistence in sessionStorage
- Validation at each step
- Image upload with preview

#### QR Store System
- Permanent URLs: `/store/[branchId]`
- Customer can browse without auth
- Cart stored in localStorage
- Order placement with contact details

### Cursor Rules Integration

**Important**: Project includes 12 Cursor rule files in `.cursor/rules/` that provide additional development guidance. Key rules:

- `project-structure.mdc`: Directory organization
- `component-patterns.mdc`: React best practices
- `data-fetching.mdc`: Server Actions and Convex patterns
- `forms-validation.mdc`: Zod schemas and validation
- `state-management.mdc`: Client/server state patterns
- `performance-optimization.mdc`: Bundle and React optimization
- `ui-components.mdc`: shadcn/ui usage guidelines
- `database-schema.mdc`: Convex schema design

**Note**: Cursor rules reference Yarn, but project uses Bun exclusively.

### Code Standards

- TypeScript: Strict mode, avoid `any`
- Components: Functional only, one per file, Server Components by default
- Hooks: Prefix with `use`, custom hooks in `/hooks/`
- Imports: Clean up unused, use named exports
- Console: Remove `console.log` before production
- Commits: Conventional format (feat:, fix:, refactor:, etc.)
- Error Boundaries: Wrap async components
- Loading States: Use Suspense with loading.tsx files