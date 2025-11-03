# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` - Start both Next.js (http://localhost:3000) and Convex dev servers concurrently
- `bun run build` - Build production bundle (runs `bunx convex codegen` then `next build`)
- `bun start` - Start production server
- `bun run lint` - Run Next.js linter
- `bunx convex codegen --typecheck disable` - Generate TypeScript types from Convex schema (MUST run manually after schema changes)

### Database Seeding
- `bun seed` - Basic test data with minimal setup
- `bun seed:logos` - Full seeding with SVG logos, images, QR codes (creates 5 stores, 8 branches, 18 shelves)

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
- `bunx convex env list` - List current environment variables
- Dashboard: https://dashboard.convex.dev

### Package Management
This project uses **Bun exclusively**. Install dependencies with `bun install`.
- ALWAYS use `bunx` prefix for executing packages (not `npx`)
- Use `bun add` for adding dependencies
- Use `bun add -d` for dev dependencies

**Note**: Cursor rules reference Yarn, but the project uses Bun for ALL operations.

## Critical Configuration Notes

### Build Configuration
⚠️ **WARNING**: TypeScript errors are IGNORED in production builds (`ignoreBuildErrors: true` in next.config.mjs). This means builds will succeed even with type errors. Always check TypeScript manually before deploying.

### Convex Codegen
After ANY schema changes in `/convex/schema.ts`:
1. Run `bunx convex codegen --typecheck disable`
2. This is NOT automatic - must be done manually
3. Generates types in `/convex/_generated/`

## Architecture Overview

### Project Context
شبر (Shibr) is a B2B marketplace platform connecting physical stores with online brands through a shelf rental system in Saudi Arabia. Physical stores monetize unused shelf space while online brands gain physical retail presence.

### Core Business Logic

#### Authentication Flow (Verify-Before-Create Pattern)
1. **Signup**: User data stored in sessionStorage → Email OTP sent → Verify OTP → Create account & profile
2. **Password Reset**: Uses Convex Auth's built-in OTP system via `authPasswordReset.ts`
3. **Email Provider**: Resend API with `noreply@shibr.io` domain (emails lowercase normalized)
4. **Phone Verification**: Alternative OTP system in `/convex/phoneVerification.ts` (574 lines)
5. **Session Management**: JWT-based with Convex Auth, 30-day expiry
6. **OTP System**: Unified table for email/phone, 6-digit codes, 10-minute expiry, 3 attempt limit

#### Rental Workflow State Machine
```
pending → payment_pending → active → completed/cancelled
         ↓                    ↓
    rejected              suspended
```
- **Note**: `payment_pending` replaces old "accepted" status
- Webhook validation for payment confirmation via Tap Gateway
- Automatic status updates via Convex mutations
- Commission structure: Platform (8%) + Store (10%) stored as array objects

#### User Journey
1. Users sign up selecting role (store owner or brand owner)
2. Store owners create branches (each gets a permanent QR code) and list shelves with location, size, and pricing
3. Brand owners browse marketplace and request rentals
4. Real-time chat between parties
5. Store owners approve/reject requests
6. Payment processing via Tap Payment Gateway with webhook confirmation
7. Approved rentals become active contracts - brand products appear in the branch's QR store
8. QR store allows customers to browse products and place orders

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun (package management and scripts)
- **Language**: TypeScript with strict mode
- **Database**: Convex (real-time, reactive backend with WebSocket sync)
- **Authentication**: Convex Auth (password-based with OTP verification)
- **Email**: Resend API (noreply@shibr.io)
- **SMS**: Karzoun API integration
- **Payments**: Tap Payment Gateway (rentals) + Wafeq (QR store invoices)
- **UI Components**: 52 shadcn/ui components (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form + Zod validation
- **Maps**: Google Maps API (for location selection)
- **i18n**: Custom context-based implementation (296KB translation file)
- **QR Codes**: react-qr-code for store generation
- **File Storage**: Convex built-in storage (5GB limit per deployment)

### Route Structure & User Roles

Three distinct user types with role-based access control:

1. **Admin Dashboard** (`/admin-dashboard/*`)
   - User management with 4-role RBAC system:
     - `super_admin`: Full system access (initial: it@shibr.io / wwadnj0aw2nc@!!)
     - `support`: User/content management
     - `finance`: Financial operations
     - `operations`: Platform operations
   - Platform settings and configuration
   - Analytics and metrics dashboard
   - Content moderation and approval workflows
   - Implementation: `/convex/admin.ts` (1635 lines) + 8 admin modules

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

Complete schema in `/convex/schema.ts` (481 lines) with strategic indexing for performance.

#### Core Tables (26+ total)
- **users** - Convex Auth managed user accounts
- **authAccounts** - Authentication providers (password)
- **authSessions** - Active user sessions (30-day expiry)
- **authOTPs** - Unified OTP storage for email/phone verification
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
  - Commission rates as array: `[{type: "platform", rate: 8}, {type: "store", rate: 10}]`
  - Payment references (Tap gateway)
  - Duration and pricing details
- **products** - Brand inventory
  - Multiple images support (up to 5)
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
  - Tax settings (15% VAT for display only)
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
- **phoneVerificationOTP** - Phone number verification (separate from authOTPs)
- **auditLogs** - Admin action tracking
- **supportTickets** - Customer support system
- **_storage** - Convex file storage metadata

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

The app is fully bilingual with RTL/LTR support (296KB translation file):

#### Implementation
- Context: `/contexts/localization-context.tsx` (500+ translation keys)
- Hook: `const { t, language, direction } = useLanguage()`
- Storage: Language preference in localStorage

#### Critical Rules
- **ALL text must use translation keys** - NEVER hardcode strings
- **Every key needs both languages**: `"key": { en: "English", ar: "العربية" }`
- **Direction-aware styling**: Use `direction` for RTL/LTR layouts
- **Font switching**: `${direction === "rtl" ? "font-cairo" : "font-inter"}`
- **Number formatting**: ALWAYS English numerals (0-9), use `formatters.ts` with `en-US` locale
- **Date system**: Gregorian calendar only, format: `DD/MM/YYYY`
- **Phone numbers**: Saudi format validation (05XXXXXXXX)
- **Currency**: SAR with 2 decimal places

### Tax & Financial Calculations

**CRITICAL**: 15% VAT is calculated for DISPLAY ONLY - never stored in database:
```typescript
// In formatters.ts
export const formatPriceWithTax = (price: number) => {
  const VAT_RATE = 0.15
  const priceWithTax = price * (1 + VAT_RATE)
  return formatCurrency(priceWithTax)
}
```

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
- 52 components available in project

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
- **Pagination**: Backend cursor-based (10 items default)
- **Loading**: Skeletons on initial load, preserve data during updates
- **Images**: Convex file storage with URL generation (5GB limit)
- **Caching**: Convex handles query caching automatically

### Form Patterns

- Validation: Zod schemas in `/lib/validations.ts`
- State: React Hook Form with `useForm`
- Errors: Field-level validation on blur
- Submission: Optimistic updates where appropriate
- Multi-step forms: Progress stored in sessionStorage

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
KARZOUN_API_KEY=<sms-provider-key>
WAFEQ_API_KEY=<invoice-api-key>
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
3. `bun run build` (will succeed even with TS errors!)
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
- `/convex/phoneVerification.ts` (574 lines) - Phone verification
- `/convex/branches.ts` (412 lines) - Store branch management
- `/convex/products.ts` (623 lines) - Inventory management
- `/convex/conversations.ts` (387 lines) - Real-time chat
- `/convex/customerOrders.ts` - QR store orders
- `/convex/notifications.ts` - Alert system
- `/convex/auditLogs.ts` - Admin activity tracking

#### Admin Modules (in `/convex/admin/`)
- `shelves.ts` - Shelf management
- `users.ts` - User administration
- `dashboard.ts` - Analytics
- `support.ts` - Customer support
- `finance.ts` - Financial operations
- `operations.ts` - Platform operations
- `content.ts` - Content management
- `settings.ts` - System configuration

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

// Paginated queries with cursor
export const list = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { cursor, limit = 10 }) => {
    const results = await ctx.db
      .query("shelves")
      .withIndex("by_status")
      .filter(q => q.eq(q.field("status"), "available"))
      .paginate({ cursor, numItems: limit })
    return results
  }
})

// Transaction with multiple operations
export const approveRequest = mutation({
  handler: async (ctx, { requestId }) => {
    // Update request status
    await ctx.db.patch(requestId, { status: "payment_pending" })
    // Create payment record
    await ctx.db.insert("payments", { ... })
    // Send notification
    await ctx.scheduler.runAfter(0, api.notifications.send, { ... })
  }
})
```

### Important Files

- `/convex/schema.ts` - Database schema definition (481 lines)
- `/convex/auth.ts` - Authentication configuration
- `/contexts/localization-context.tsx` - All translations (296KB)
- `/lib/formatters.ts` - Number/date/currency formatting with VAT
- `/lib/validations.ts` - Zod validation schemas
- `/lib/constants.ts` - App-wide constants
- `/lib/error-logger.ts` - Centralized error logging (280 lines)
- `/middleware.ts` - Route protection + CSP headers
- `/components/ui/` - 52 shadcn/ui components
- `/hooks/` - Custom React hooks

### Security Patterns

#### Content Security Policy
Configured in `/middleware.ts` with specific exemptions:
- Google Maps API for location selection
- Tap Payment Gateway for checkout frames
- Convex WebSocket for real-time features
- Strict CSP headers for XSS protection
- HSTS enabled only in production

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
- Email addresses normalized to lowercase

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
- Cursor-based pagination for large datasets

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

### Non-Obvious Systems

#### Tax Calculation
- 15% VAT applied at display time, NOT stored in DB
- Calculated in `/lib/formatters.ts`
- Shown on all pricing displays
- Included in payment processing

#### Multi-Step Form System
- Shelf creation: 7-step wizard (34KB component)
- Progress persistence in sessionStorage
- Validation at each step
- Image upload with preview (up to 5 images)

#### QR Store System
- Permanent URLs: `/store/[branchId]`
- Customer can browse without auth
- Cart stored in localStorage
- Order placement with contact details
- Integration with Wafeq for invoicing

#### File Storage
- Uses Convex built-in storage
- 5GB limit per deployment
- Automatic URL generation
- Supports images and documents

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

- TypeScript: Strict mode, avoid `any` (but build errors ignored in production!)
- Components: Functional only, one per file, Server Components by default
- Hooks: Prefix with `use`, custom hooks in `/hooks/`
- Imports: Clean up unused, use named exports
- Console: Remove `console.log` before production
- Commits: Conventional format (feat:, fix:, refactor:, etc.)
- Error Boundaries: Wrap async components
- Loading States: Use Suspense with loading.tsx files
- Numbers: Always format with English numerals (0-9)
- Dates: Use DD/MM/YYYY format