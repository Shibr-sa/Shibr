# شبر

A smart platform connecting physical and online stores through a shelf rental system, targeting the Saudi Arabian market.

## Overview

شبر enables physical stores to rent out shelf space to online brands, creating a seamless bridge between digital and physical retail.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun
- **Database**: Convex (real-time backend)
- **UI**: shadcn/ui components with Tailwind CSS
- **Authentication**: Convex Auth
- **Languages**: Arabic & English with RTL support

## Getting Started

### Prerequisites
- Bun installed on your system
- Convex account for backend services

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

This starts both the Next.js development server (http://localhost:3000) and Convex backend.

### Build

```bash
bun run build
```

## Features

- **Multi-role Dashboard**: Separate dashboards for store owners, brand owners, and admins
- **Real-time Chat**: Built-in messaging between stores and brands
- **Marketplace**: Browse and rent available shelf spaces
- **Bilingual Support**: Full Arabic and English interface with RTL/LTR switching
- **Location-based Search**: Find shelves near specific locations
