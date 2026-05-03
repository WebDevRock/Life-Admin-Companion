# Life Admin Companion

## Overview

A full-stack web app that helps people manage everyday life admin in one private, calm dashboard. Tracks bills, renewals, warranties, documents, appointments, and deadlines. Designed for ordinary households, families, carers, and anyone who struggles to keep track of life admin.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `life-admin`, preview path: `/`)
- **API framework**: Express 5 (artifact: `api-server`, preview path: `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect with PKCE via `@workspace/replit-auth-web`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter
- **Forms**: react-hook-form + shadcn Form + zodResolver

## Database Schema

### `sessions` (auth, managed by replit-auth)
Session storage for Replit Auth.

### `users` (auth, managed by replit-auth)
Stores user profiles from Replit OIDC (id, email, firstName, lastName, profileImageUrl).

### `life_admin_items`
Core table. Every row is scoped by `user_id`.
- id, userId, title, category, provider, referenceNumber
- status: active | completed | renewed | cancelled | archived
- dueDate, renewalDate, reminderDate
- costAmount, costFrequency: one-off | weekly | monthly | quarterly | annually | unknown
- notes, usefulLink
- priority: low | normal | high
- createdAt, updatedAt

## Pages

- `/` — Landing page with hero copy and login CTA
- `/dashboard` — Summary cards, needs attention, upcoming 30 days, recently updated (protected)
- `/items` — All items list with search, category/status/due-soon filters (protected)
- `/items/new` — Add item form (protected)
- `/items/:id` — Item detail view (protected)
- `/items/:id/edit` — Edit item form (protected)
- `/archived` — Archived items (protected)
- `/about` — About and privacy page

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Key Files

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/auth.ts` — Auth DB schema (sessions, users)
- `lib/db/src/schema/lifeAdminItems.ts` — Life admin items schema
- `artifacts/api-server/src/routes/items.ts` — Items CRUD routes
- `artifacts/api-server/src/routes/dashboard.ts` — Dashboard summary routes
- `artifacts/api-server/src/routes/auth.ts` — Replit Auth routes
- `artifacts/api-server/src/lib/auth.ts` — OIDC config and session management
- `artifacts/api-server/src/middlewares/authMiddleware.ts` — Auth middleware
- `artifacts/life-admin/src/App.tsx` — Router with protected routes
- `lib/replit-auth-web/` — Browser auth hook (`useAuth`)

## Recurring Items

Items can be set as recurring with a frequency of weekly, monthly, quarterly, or annually.

When a recurring item's status is set to **"renewed"** via the PUT `/api/items/:id` endpoint, the server automatically creates a new active item with:
- All the same fields (title, category, provider, cost, notes, etc.)
- Due date, renewal date, and reminder date all advanced by the recurrence interval
- Status set to "active"
- `isRecurring: true` and the same `recurrenceFrequency`

The original item is kept in "renewed" status. The new item appears in the items list and dashboard immediately.

The recurring section in the item form shows a toggle and — when enabled — a frequency picker. A "Repeats {frequency}" badge appears in the items list and detail view. The detail view also shows an explanatory card about the auto-create behaviour.

## Notes

- All queries are scoped by `user_id` — users only see their own data
- Items can be archived (status = "archived") instead of deleted
- No email/push notifications — reminders are shown inside the dashboard
- Notes and links are stored as text; no file uploads in MVP
- Recurring item auto-creation happens server-side in the PUT route — no client-side logic needed
