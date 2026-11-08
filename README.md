# MementoRoll

> **Every Moment Deserves a Frame.**

MementoRoll is a multi-tenant digital disposable camera platform for weddings, birthdays, graduations, corporate events, and other celebrations. Event owners share a private guest link and PIN; guests capture up to 25 successfully uploaded photographs from their mobile browser without installing an app or creating an account.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)

## Product workflow

1. An owner registers and receives a package entitlement.
2. The owner creates and activates an event.
3. MementoRoll generates a unique guest URL and one-time six-digit PIN.
4. Guests enter the PIN and a display name, then grant camera permission.
5. Each guest receives a maximum of 25 successfully finalized photographs.
6. Images are processed into private originals and thumbnails.
7. The owner reviews and downloads photographs from a private gallery.

## Features

### Event owners

- Supabase email/password authentication and protected routes
- Tenant-scoped event creation, activation, and closure
- Package-backed storage entitlements
- One-time guest URL and PIN handoff
- Guest, photograph, and storage statistics
- Private gallery with short-lived download URLs
- Permanent event and media deletion with typed confirmation

### Event guests

- Account-free access through a unique event URL
- Server-validated event PIN and secure guest session
- Mobile-first browser camera with front/rear switching
- Explicit camera-permission flow and useful recovery messages
- Concurrency-safe 25-shot allowance
- Verified upload feedback—the counter changes only after finalization
- Session persistence across refreshes

### Administration

- Server-enforced administrator role
- Customer, event, photo, and storage statistics
- Database-backed packages, orders, audit logs, and webhook records

## Technology stack

| Layer | Technology |
| --- | --- |
| Application | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, custom design tokens, Lucide icons |
| Forms | React Hook Form, Zod |
| Authentication | Supabase Auth with cookie-based SSR sessions |
| Database | Supabase PostgreSQL with Row Level Security |
| Storage | Private Cloudflare R2 through the S3-compatible API |
| Image processing | Sharp |
| Security | Argon2id, HMAC-SHA256, CSP, secure cookies, signed URLs |
| Testing | Vitest, Playwright, Supabase SQL tests |
| Deployment target | Vercel |

## Architecture

MementoRoll is a modular monolith. Next.js provides the interfaces and route handlers, Supabase provides authentication and PostgreSQL, and Cloudflare R2 stores private media.

```text
Guest browser                         Owner browser
      |                                     |
      | PIN + guest cookie                  | Supabase Auth cookie
      +------------------+------------------+
                         v
               Next.js application
          UI, APIs, validation, authorization
                         |
               +---------+---------+
               v                   v
      Supabase PostgreSQL     Cloudflare R2
      Auth, RLS, quotas,      Private originals,
      reservations, metadata thumbnails, exports
```

### Secure upload lifecycle

1. PostgreSQL atomically reserves one shot and expected storage.
2. The server issues a five-minute presigned R2 upload URL.
3. The browser uploads directly to the private bucket.
4. Sharp decodes the object, validates dimensions and format, removes unnecessary metadata, and converts it to WebP.
5. The server generates a private thumbnail.
6. PostgreSQL finalizes the photograph and releases reservations.
7. The visible shot counter updates only after successful finalization.

## Security model

- RLS is enabled on every application table.
- Owners can access only their own events and media.
- Administrator privileges cannot be self-assigned during registration.
- Event and session tokens are stored as keyed hashes; PINs use Argon2id.
- Guest cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- PIN attempts are rate-limited without storing raw IP addresses.
- Supabase and R2 secret credentials remain server-only.
- The R2 bucket remains private; all browser access uses short-lived signed URLs.
- Images are decoded and validated before an upload counts as successful.
- Event deletion removes authorized storage objects before database cleanup.

## Getting started

### Prerequisites

- Node.js 20.9 or newer
- npm
- A Supabase project
- A Cloudflare account with R2 enabled

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the environment

```powershell
Copy-Item .env.example .env.local
```

Complete `.env.local` with credentials from your own services:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=mementoroll-private
R2_ENDPOINT=

SESSION_SECRET=
TOKEN_HASH_SECRET=
SENTRY_DSN=
TEST_PAYMENT_MODE=false
```

Never commit `.env.local` or place server credentials in `NEXT_PUBLIC_*` variables.

### 3. Apply database migrations

Run these migrations in order with the Supabase CLI or SQL Editor:

```text
supabase/migrations/202611080001_initial_schema.sql
supabase/migrations/202611080002_event_deletion.sql
supabase/migrations/202611080003_coupons.sql
```

They install the schema, constraints, indexes, RLS policies, seed plans, atomic reservation functions, owner-authorized deletion, and server-enforced coupons.

### 4. Configure Supabase Auth

1. Enable Email under **Authentication → Sign In / Providers**.
2. Set the local Site URL to `http://localhost:3000`.
3. Allow `http://localhost:3000/auth/callback` as a redirect URL.
4. Keep email confirmation enabled for realistic testing.

### 5. Configure Cloudflare R2

1. Create a private bucket named `mementoroll-private`.
2. Create an Object Read & Write token restricted to that bucket.
3. Add the S3 endpoint and credentials to `.env.local`.
4. Allow `GET`, `PUT`, and `HEAD` from the application origin in R2 CORS.

### 6. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Camera APIs require a secure context. `localhost` works for desktop development; physical-phone testing requires an HTTPS preview deployment or development tunnel.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run typecheck` | Validate TypeScript |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright tests |

## Project structure

```text
src/
├── app/                    Pages and route handlers
│   ├── (auth)/             Authentication interfaces
│   ├── admin/              Platform administration
│   ├── api/                Server APIs
│   ├── dashboard/          Owner portal
│   ├── e/[token]/          Guest access and camera
│   └── gallery/[eventId]/  Owner-only gallery
├── components/             Reusable feature components
├── lib/
│   ├── cloudflare/         Private R2 integration
│   ├── security/           Tokens, PINs, and guest sessions
│   └── supabase/           Supabase clients
└── proxy.ts                Session-refresh middleware

supabase/
├── migrations/             Versioned schema changes
└── tests/                  RLS and isolation checks
```

## Testing

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Database tests require a local Supabase CLI environment. Real R2 uploads, email delivery, mobile camera behavior, payments, and concurrency must be tested against configured external services.

## Development payments

`TEST_PAYMENT_MODE=true` exposes one 100%-off development coupon per package and allows each account to redeem each code once. Keep it `false` in production. A live integration must verify signed, idempotent webhooks before granting paid entitlements and must handle failures and refunds.

## Deployment checklist

1. Apply every database migration.
2. Store secrets in the deployment platform, never in Git.
3. Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS production origin.
4. Add the production callback URL to Supabase Auth.
5. Add the production origin to R2 CORS.
6. Confirm the R2 bucket remains private.
7. Set `TEST_PAYMENT_MODE=false`.
8. Configure production SMTP, monitoring, retention, and deletion jobs.
9. Run tenant-isolation, concurrency, camera, and end-to-end tests.

## Project status

MementoRoll is an active MVP. Authentication, event creation, guest PIN sessions, mobile capture, private upload processing, quota enforcement, owner galleries, temporary downloads, and permanent event deletion are implemented.

Further production work includes:

- Live payment-provider integration and verified webhooks
- Background ZIP export execution and expiration cleanup
- Complete PIN-reset and QR-management interfaces
- Automated retention/deletion workers
- Expanded integration, concurrency, and Playwright coverage
- Cross-device verification against production Supabase and R2 environments

## Contributing

1. Create a focused branch.
2. Keep credentials and local environment files out of commits.
3. Add tests for behavior changes.
4. Run all validation commands before submitting changes.
5. Document security, migration, and deployment implications.

## Responsible disclosure

Do not open public issues containing credentials, private event links, PINs, object keys, personal information, or exploitable security details. Revoke any credential immediately if it is exposed.

---

Built for candid moments, private collections, and events worth remembering.
