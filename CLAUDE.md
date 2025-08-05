# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Always Follow Standards & Best Practices

**MANDATORY**: Every piece of code, component, and feature MUST adhere to:
1. **Industry Standards** - Follow established patterns from React, Next.js, and TypeScript communities
2. **shadcn/ui Conventions** - Use only shadcn components with their standard implementations
3. **Accessibility Standards** - WCAG 2.1 AA compliance minimum
4. **Performance Best Practices** - Code splitting, lazy loading, optimization
5. **Security Standards** - OWASP guidelines, secure coding practices
6. **Testing Standards** - Comprehensive test coverage for critical paths
7. **Documentation Standards** - Clear, concise comments and documentation

**NEVER**:
- Create custom solutions when standard ones exist
- Modify shadcn/ui components
- Use deprecated or outdated patterns
- Hardcode values that should be configurable
- Skip error handling or validation
- Ignore TypeScript errors or use `any` without justification

### Version Control Standards
- **Commit Messages**: Use conventional commits (feat:, fix:, docs:, style:, refactor:)
- **Branch Naming**: feature/*, bugfix/*, hotfix/* patterns
- **Pull Requests**: Always include description and testing steps
- **Code Reviews**: Required before merging to main
- **Git Hooks**: Use pre-commit hooks for linting and formatting

### Deployment Standards
- **Environment Variables**: Separate configs for dev, staging, production
- **Build Optimization**: Enable all Next.js optimizations
- **Error Monitoring**: Implement error tracking (Sentry, etc.)
- **Performance Monitoring**: Track Core Web Vitals
- **SEO**: Proper meta tags, sitemap, robots.txt
- **Analytics**: Implement privacy-respecting analytics

## Commands

### Development
- `bun dev` - Start development server on http://localhost:3000
- `bun run build` - Build production bundle
- `bun start` - Start production server
- `bun run lint` - Run Next.js linter

### Package Management
This project uses Bun. Install dependencies with `bun install`.

## Architecture Overview

### Project Context
Shibr is a smart platform connecting physical and online stores through a shelf rental system, targeting the Saudi Arabian market. The platform enables physical stores to rent out shelf space to online brands.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **UI**: Radix UI primitives wrapped with shadcn/ui components
- **Styling**: Tailwind CSS with custom design system variables
- **State**: React Context API for global state (language/theme)
- **Forms**: React Hook Form + Zod validation
- **Auth**: NextAuth.js (credentials provider)
- **i18n**: Custom implementation in `/contexts/language-context.tsx`

### Route Structure & User Roles

The application has three distinct user types, each with their own dashboard:

1. **Admin Dashboard** (`/admin-dashboard/*`)
   - Platform administration
   - User/store management
   - Revenue analytics
   
2. **Brand Dashboard** (`/brand-dashboard/*`)
   - For online store owners
   - Manage shelf rentals in physical stores
   - Product placement tracking
   
3. **Store Dashboard** (`/store-dashboard/*`)
   - For physical store owners
   - Manage available shelf space
   - Order fulfillment

Public routes include `/marketplace` for store discovery and `/signin`, `/signup` for authentication.

### Key Architectural Patterns

#### Internationalization
The app supports Arabic/English with RTL/LTR switching:
- Language context at `/contexts/language-context.tsx` contains all translations (500+ keys)
- Use `useLanguage()` hook to access translations: `const { t, language, direction } = useLanguage()`
- **CRITICAL RULES**:
  - **ALL text must use translation keys** - NEVER hardcode strings in any language
  - **Every Arabic key must have an English equivalent** and vice versa
  - **Always add translations for BOTH languages** when creating new keys
  - **Use the `direction` value** to handle RTL/LTR specific layouts
  - **Apply `dir={direction}` attribute** on container elements
  - **Use conditional font classes**: `${direction === "rtl" ? "font-cairo" : "font-inter"}`

#### Component Structure
- UI components in `/components/ui/` are from shadcn/ui - don't modify directly
- Custom components go in `/components/`
- Each dashboard has its own layout component with sidebar navigation
- Loading states use `loading.tsx` files in each route

#### Data Flow
- Mock data is currently hardcoded in components
- Forms use React Hook Form with Zod schemas
- Tables use shadcn/ui Table component with built-in sorting/filtering

### Important Files

- `/contexts/language-context.tsx` - All translations and language switching logic
- `/app/layout.tsx` - Root layout with providers
- `/lib/utils.ts` - Utility functions including `cn()` for className merging
- `/components/ui/` - shadcn/ui component library (don't modify)

### Development Guidelines

When adding new features:
1. Check if translation keys exist before adding new ones
2. Use existing UI components from `/components/ui/`
3. Follow the established dashboard layout patterns
4. Maintain TypeScript strict mode compliance
5. Ensure RTL compatibility for Arabic text
6. Use logical properties (start/end) instead of physical (left/right)

When modifying dashboards:
- Each dashboard type has consistent navigation in its layout file
- Dashboard routes follow pattern: `/[type]-dashboard/[feature]/page.tsx`
- Use the existing table/card patterns for data display

Authentication flow:
- Sign up includes account type selection (store vs brand owner)
- Role determines dashboard redirection after login
- Admin accounts would be created separately (not via signup)

## Design Standards & Best Practices

### Translation & Localization Standards
- **Complete Coverage Rule**: EVERY piece of text must exist in BOTH Arabic and English
- **No Hardcoded Text**: Never write text directly in components, always use `t("key")`
- **Translation Key Format**: Use descriptive, nested keys (e.g., `auth.signin.title`)
- **Adding New Translations**:
  1. Add the Arabic version in the `ar` object
  2. Add the English version in the `en` object
  3. Test both languages to ensure proper display
- **Direction-Aware Layouts**:
  ```tsx
  const { t, direction } = useLanguage()
  return (
    <div dir={direction} className={direction === "rtl" ? "font-cairo" : "font-inter"}>
      {/* Content */}
    </div>
  )
  ```
- **Icons & Images**: Mirror icons that have directional meaning (arrows, etc.)
- **Number Formatting**: Use locale-aware number formatting for prices/quantities
- **Date Formatting**: Use locale-aware date formatting

### UI Component Usage
- **ALWAYS use shadcn/ui components** from `/components/ui/` - never create custom versions
- **NEVER modify shadcn/ui components directly** - they are maintained as a library
- When shadcn component doesn't exist, check Radix UI primitives before creating custom
- Use the `cn()` utility from `/lib/utils.ts` for conditional className merging

### Spacing Standards
- **Between form elements**: Use `space-y-6` for form field groups
- **Within form groups**: Use `space-y-2` between label and input
- **Checkbox/Radio with labels**: Use `gap-2` (8px standard spacing)
- **Card sections**: Use `space-y-4` or `space-y-6` for content sections
- **Button groups**: Use `gap-2` for inline buttons, `space-y-2` for stacked
- **Page margins**: Use `p-6` for page padding, `max-w-md/lg/xl` for content width
- **Section spacing**: Use `mb-8` between major sections

### Form Design Standards
- **Input height**: Use `h-12` for all form inputs (consistent touch target)
- **Label styling**: Use `text-sm font-medium text-foreground`
- **Placeholder text**: Always include helpful placeholder text using translation keys
- **Required fields**: Use HTML5 `required` attribute for validation
- **Error states**: Display field-level errors below inputs
- **Submit buttons**: Full width (`w-full`) with `h-12` height

### Typography Standards
- **Headings**: Use semantic HTML (h1, h2, etc.) with consistent sizing
  - h1: `text-2xl font-bold`
  - h2: `text-xl font-semibold`
  - h3: `text-lg font-medium`
- **Body text**: `text-sm` for standard text, `text-base` for emphasis
- **Muted text**: Use `text-muted-foreground` for secondary information
- **Links**: Use `text-primary hover:underline` for inline links

### Color Usage
- **DO NOT use custom colors** - only use design system variables:
  - `primary`, `secondary`, `destructive`, `muted`, `accent`
  - `foreground`, `background`, `border`, `ring`
  - Each color has DEFAULT and foreground variants
- **Status colors**: Use semantic colors (destructive for errors, primary for success)

### Brand Colors
- **Primary Color**: #725CAD (Purple) - Used for primary actions, buttons, and brand elements
- **Secondary Color**: #283455 (Dark Blue) - Used for text titles and secondary elements
- **Text Title Color**: #283455 (Same as Secondary) - Used for headings and important text
- These colors are configured in the CSS variables and should be accessed via Tailwind classes:
  - Use `bg-primary`, `text-primary`, `border-primary` for primary color
  - Use `bg-secondary`, `text-secondary`, `border-secondary` for secondary color
  - Use `text-foreground` for main text, `text-muted-foreground` for secondary text

### Layout Patterns
- **Cards**: Use Card components for grouped content with consistent padding
- **Responsive design**: Mobile-first approach using Tailwind responsive prefixes
- **RTL/LTR Support**: 
  - **ALWAYS use logical properties** instead of physical ones:
    - Use `ps-*` (padding-start) instead of `pl-*` (padding-left)
    - Use `pe-*` (padding-end) instead of `pr-*` (padding-right)
    - Use `ms-*` (margin-start) instead of `ml-*` (margin-left)
    - Use `me-*` (margin-end) instead of `mr-*` (margin-right)
    - Use `start-*` instead of `left-*` for positioning
    - Use `end-*` instead of `right-*` for positioning
    - Use `text-start` instead of `text-left`
    - Use `text-end` instead of `text-right`
  - Use `gap-*` instead of `space-x-*` for flexbox/grid spacing
  - Use `rounded-s-*` and `rounded-e-*` instead of `rounded-l-*` and `rounded-r-*`
  - **Directional Icons**: Use rotation or conditional rendering for arrows:
    ```tsx
    // For arrows that should flip in RTL
    <ArrowRight className={direction === "rtl" ? "rotate-180" : ""} />
    // Or use different icons
    {direction === "rtl" ? <ArrowLeft /> : <ArrowRight />}
    ```
  - **Always test both directions** when implementing new layouts
- **Loading states**: Implement skeleton loaders using Skeleton component
- **Empty states**: Provide meaningful empty state messages with actions

### Code Quality Standards
- **TypeScript**: 
  - Strict mode enabled, no `any` types without justification
  - Define interfaces/types for all props, state, and function parameters
  - Use type inference where possible, explicit types where necessary
  - Prefer `interface` over `type` for object shapes
- **React Best Practices**:
  - Functional components only (no class components)
  - Custom hooks for reusable logic (prefix with `use`)
  - Proper dependency arrays in hooks
  - Avoid inline function definitions in JSX
  - Use controlled components for forms
- **State Management**:
  - Local state for component-specific data
  - Context API only for truly global state
  - Avoid prop drilling beyond 2-3 levels
  - Consider state colocation (keep state close to where it's used)
- **Performance Optimization**:
  - Use `React.memo` for expensive components
  - `useMemo` for expensive computations
  - `useCallback` for functions passed to memoized components
  - Lazy load routes and heavy components
  - Image optimization with Next.js Image component
- **Error Handling**:
  - Try-catch blocks for async operations
  - Error boundaries for component trees
  - User-friendly error messages
  - Proper loading and error states
  - Form validation with helpful feedback
- **Code Organization**:
  - One component per file
  - Group related files in folders
  - Consistent file naming (kebab-case for files, PascalCase for components)
  - Separate business logic from UI components
  - Utils functions in `/lib` directory

### Accessibility Standards
- **ARIA labels**: Ensure all interactive elements have proper labels
- **Keyboard navigation**: All features must be keyboard accessible
- **Focus management**: Proper focus states and tab order
- **Screen readers**: Test with screen readers for critical flows
- **Color contrast**: Maintain WCAG AA compliance minimum

### Data Fetching & API Standards
- **Server Components**: Use for initial data fetching when possible
- **Client Components**: Use `useEffect` or SWR/React Query for client-side fetching
- **Loading States**: Always show loading indicators during data fetching
- **Error States**: Handle all possible error scenarios gracefully
- **Caching**: Implement appropriate caching strategies
- **API Routes**: Use Next.js API routes for backend logic
- **Environment Variables**: Store API keys and secrets in `.env.local`

### Form Handling Standards
- **React Hook Form**: Use for all forms (already installed)
- **Zod Validation**: Define schemas for type-safe validation
- **Field-Level Validation**: Show errors immediately after field blur
- **Submit Validation**: Validate entire form before submission
- **Success Feedback**: Clear confirmation when actions complete
- **Progressive Enhancement**: Forms should work without JavaScript where possible
- **Accessibility**: Proper labels, error announcements, keyboard navigation

### Security Best Practices
- **Input Sanitization**: Always sanitize user inputs
- **XSS Prevention**: Use React's built-in escaping
- **CSRF Protection**: Use Next.js built-in CSRF protection
- **Authentication**: Implement proper session management
- **Authorization**: Check permissions on both client and server
- **Sensitive Data**: Never expose API keys or secrets in client code
- **HTTPS Only**: Ensure all production deployments use HTTPS

### Testing Approach
- **Unit tests**: For utility functions and business logic
- **Component tests**: For complex interactive components
- **Integration tests**: For critical user flows
- **E2E tests**: For authentication and payment flows
- **Test Coverage**: Aim for 80% coverage on critical paths
- **Test Naming**: Use descriptive test names that explain the scenario