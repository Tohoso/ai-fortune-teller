# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered fortune-telling system (占い自動鑑定システム) that uses Claude API to generate personalized fortune readings. The system is built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and Supabase.

## Common Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run dev:all               # Start dev server with Stripe webhook listener

# Database
npm run db:push               # Push schema changes to database  
npm run db:migrate            # Run database migrations
npm run db:seed               # Seed database with test data
npm run db:studio             # Open Prisma Studio

# Code Quality
npm run type-check            # TypeScript type checking
npm run lint                  # ESLint linting
npm run format                # Prettier formatting

# Testing
npm test                      # Run unit tests
npm run test:e2e             # Run E2E tests

# Build & Deploy
npm run build                 # Build for production
npm run start                 # Start production server
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, tRPC, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js v5
- **AI Integration**: Anthropic Claude API (claude-3-sonnet)
- **Payments**: Stripe
- **Email**: Resend
- **PDF Generation**: React PDF
- **Queue Management**: Bull with Redis

### Key Design Patterns
1. **Feature-Sliced Design** for component organization (not Atomic Design)
2. **tRPC** for type-safe API calls between frontend and backend
3. **Row Level Security (RLS)** in Supabase for data access control
4. **Queue-based processing** for AI generation (rate limit: 10 requests/minute)

### Directory Structure
```
app/                    # Next.js App Router pages
├── (auth)/            # Public auth pages (login, register)
├── (main)/            # Authenticated user pages
└── (admin)/           # Admin panel pages

components/            # React components
├── ui/               # Base UI components (shadcn/ui)
├── features/         # Feature-specific components
└── layouts/          # Layout components

server/               # Backend logic
├── api/             # tRPC routers
└── services/        # Business logic services

lib/                  # Utilities and configurations
types/               # TypeScript type definitions
prisma/              # Database schema and migrations
```

### Database Schema
The system uses these main tables:
- `users` - User accounts with credit balance
- `admins` - Admin accounts (super_admin, admin roles)
- `fortune_types` - Fortune telling types (九星気学, タロット, etc.)
- `fortune_requests` - User fortune requests
- `ai_results` - AI-generated results with admin edits
- `fortune_results` - Final published results with PDF
- `credit_transactions` - Credit usage tracking
- `payment_history` - Stripe payment records

### API Design
Uses tRPC routers:
- `auth` - Authentication endpoints
- `fortune` - Fortune telling operations
- `credit` - Credit management
- `payment` - Stripe integration
- `admin` - Admin operations

## Key Implementation Details

### AI Integration Flow
1. User submits fortune request → Deduct credits
2. Request queued in Bull/Redis (max 2 concurrent)
3. Claude API generates fortune text (~1500 tokens)
4. Admin reviews and edits result
5. Generate PDF and notify user

### Authentication
- Users authenticate via email/password with NextAuth.js
- Admins have separate login at `/admin/login`
- JWT tokens stored in httpOnly cookies
- Middleware protects routes based on auth status

### Error Handling
- Consistent error codes: AUTH*, USER*, FORTUNE*, PAYMENT*, AI*, SYSTEM*
- All errors returned in Japanese for user-facing messages
- Use `AppError` class for throwing custom errors

### State Management
- Local state: `useState`
- Form state: React Hook Form with Zod validation
- Server state: tRPC with React Query
- Global state: Zustand (only if needed)

## Important Conventions

### Git Workflow
- Branch naming: `<type>/<issue-number>-<description>`
- Commit format: `<type>(<scope>): <subject>`
- Always create PRs for main branch
- Squash merge to keep history clean

### Code Style
- Functional components with TypeScript
- Prefer `interface` over `type` for object shapes
- Use `cn()` utility for conditional classes
- Mobile-first responsive design
- No `console.log` in production code

### Security
- All user inputs validated with Zod
- SQL injection prevented via Prisma
- XSS protection through React
- Rate limiting on all API endpoints
- Sensitive data encrypted in database