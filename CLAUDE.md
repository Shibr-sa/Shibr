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
- Dashboard: https://dashboard.convex.dev

### Package Management
This project uses Bun. Install dependencies with `bun install`.

**Note**: Cursor rules reference Yarn, but the project uses Bun for all operations.

## Development Workflow

### Quick Start
```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Add your Convex deployment URL and API keys

# Start development servers
bun dev
# Opens: http://localhost:3000
```

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

#### Rental Workflow State Machine
```
pending → payment_pending → active → completed/cancelled
         ↓                    ↓
    rejected              suspended
```
- Webhook validation for payment confirmation
- Automatic status updates via Convex mutations
- Commission calculation (platform fees applied at checkout)

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
- `/contexts/localization-context.tsx` - All translations
- `/lib/formatters.ts` - Number/date/currency formatting
- `/lib/validations.ts` - Zod validation schemas
- `/lib/constants.ts` - App-wide constants
- `/middleware.ts` - Route protection logic

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