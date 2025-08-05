# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- Use `useLanguage()` hook to access translations: `const { t, language, setLanguage } = useLanguage()`
- All text must use translation keys, never hardcode strings

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

When modifying dashboards:
- Each dashboard type has consistent navigation in its layout file
- Dashboard routes follow pattern: `/[type]-dashboard/[feature]/page.tsx`
- Use the existing table/card patterns for data display

Authentication flow:
- Sign up includes account type selection (store vs brand owner)
- Role determines dashboard redirection after login
- Admin accounts would be created separately (not via signup)