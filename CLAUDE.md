# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `bun dev` - Start Next.js development server on http://localhost:3000
- `bunx convex dev` - Start Convex backend server (run alongside `bun dev`)
- `bun run build` - Build production bundle (includes Convex codegen)
- `bun start` - Start production server
- `bun run lint` - Run Next.js linter

### Package Management
This project uses Bun. Install dependencies with `bun install`.

### Database (Convex)
- `bunx convex dev` - Start real-time backend server with hot reload
- `bunx convex deploy` - Deploy to production
- `bunx convex codegen` - Generate TypeScript types from schema
- Dashboard: https://dashboard.convex.dev

## Architecture Overview

### Project Context
Shibr is a smart platform connecting physical and online stores through a shelf rental system, targeting the Saudi Arabian market. The platform enables physical stores to rent out shelf space to online brands.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun (for package management and scripts)
- **Language**: TypeScript with strict mode
- **UI Components**: 52 shadcn/ui components (Radix UI based)
- **Styling**: Tailwind CSS with CSS variables
- **Database**: Convex (real-time, reactive backend)
- **Authentication**: Convex Auth (password-based)
- **Forms**: React Hook Form + Zod validation
- **i18n**: Custom implementation in `/contexts/localization-context.tsx`

### Route Structure & User Roles

Three distinct user types with separate dashboards:

1. **Admin Dashboard** (`/admin-dashboard/*`) - Platform administration
2. **Brand Dashboard** (`/brand-dashboard/*`) - Online store owners
3. **Store Dashboard** (`/store-dashboard/*`) - Physical store owners

Public routes: `/marketplace`, `/signin`, `/signup`

### Convex Database Schema

The backend uses 11 main tables:
- **userProfiles** - Multi-role users (store_owner, brand_owner, admin)
- **shelves** - Marketplace listings with location and pricing
- **rentalRequests** - Booking system with status management
- **products** - Brand inventory
- **conversations/messages** - Real-time chat
- **notifications** - User alerts
- **payments** - Transactions

### Internationalization (Critical)

The app supports Arabic/English with RTL/LTR switching:
- Language context at `/contexts/localization-context.tsx` contains 500+ translation keys
- Use `useLanguage()` hook: `const { t, language, direction } = useLanguage()`

**CRITICAL RULES**:
- **ALL text must use translation keys** - NEVER hardcode strings
- **Every Arabic key must have an English equivalent** and vice versa
- **Always add translations for BOTH languages** when creating new keys
- **Use the `direction` value** for RTL/LTR specific layouts
- **Apply conditional font classes**: `${direction === "rtl" ? "font-cairo" : "font-inter"}`
- **ALWAYS use English numerals** (0-9), never Arabic-Hindi numerals
- **Use Gregorian calendar only**, no Hijri dates

### shadcn/ui Component Usage (Critical)

**BEFORE IMPLEMENTING ANY UI COMPONENT**:
1. **CHECK shadcn/ui documentation FIRST**: https://ui.shadcn.com/docs/components/
2. **VERIFY if component exists** in the full component list
3. **COPY exact implementation** from documentation
4. **CHECK examples**: https://ui.shadcn.com/examples

**Implementation Rules**:
- **ALWAYS use shadcn/ui components** from `/components/ui/` exactly as documented
- **NEVER modify shadcn/ui components** - they are library code
- **NEVER create custom UI components** if shadcn/ui has an equivalent
- **USE exact props and patterns** from shadcn documentation
- Use the `cn()` utility from `/lib/utils.ts` for conditional className merging

### Important Files & Directories

- `/contexts/localization-context.tsx` - All translations and language switching
- `/lib/formatters.ts` - Centralized formatting utilities (English numerals only)
- `/lib/validations.ts` - Zod schemas for type-safe validation
- `/lib/constants.ts` - Application-wide constants and limits
- `/lib/utils.ts` - Utility functions including `cn()` for className merging
- `/components/ui/` - shadcn/ui component library (DO NOT MODIFY)
- `/components/` - Custom components specific to the application
- `/convex/` - Backend functions and schema
- `/convex/_generated/` - Auto-generated Convex client code (DO NOT EDIT)
- `/hooks/` - Custom React hooks

### Development Principles

- **Navigation**: Prefer page-based navigation over modals/dialogs for detail views
- **Performance**: Implement server-side search and pagination for large datasets
- **Loading States**: Show skeletons on initial load, keep previous data visible during updates
- **Search**: Debounce user input (300ms) before API calls
- **Pagination**: Server-side with 5-10 items per page
- **URL State**: Persist UI state (filters, pagination, tabs) in URL parameters

### Form Handling Patterns

- Use React Hook Form for all forms
- Define Zod schemas in `/lib/validations.ts`
- Show field-level errors immediately after blur
- Use controlled components
- Include helpful placeholder text using translation keys

### RTL/LTR Support

- Use logical properties: `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`
- Avoid physical properties: `pl-*`, `pr-*`, `ml-*`, `mr-*`, `left-*`, `right-*`
- Use `gap-*` instead of `space-x-*` for spacing
- Use Tailwind's `rtl:` modifiers for direction-specific styling

### Design System

- **Primary Color**: #725CAD (Purple) - The ONLY custom brand color
- **Typography**: Cairo font for Arabic, Inter for English
- **Spacing**: Use consistent spacing utilities (space-y-6 for forms, gap-2 for buttons)
- **Heights**: h-12 for all form inputs and buttons
- **DO NOT use custom colors** - only use design system CSS variables

### Version Control Standards

- **NEVER commit or push** unless explicitly instructed by user
- Use conventional commits (feat:, fix:, docs:, style:, refactor:)
- Branch naming: feature/*, bugfix/*, hotfix/*

### Code Quality Standards

- TypeScript strict mode - no `any` without justification
- Remove all console.log statements before production
- Clean up unused imports and dead code regularly
- One component per file
- Functional components only
- Custom hooks prefixed with `use`
- Centralize utilities in `/lib/`