# MementoRoll

Production-minded multi-tenant digital disposable camera MVP built with Next.js, Supabase PostgreSQL/Auth, private Cloudflare R2, TypeScript, and Tailwind CSS.

## Local setup

1. Copy `.env.example` to `.env.local` and provide real project credentials. Never commit the resulting file.
2. Create a Supabase project and run `supabase/migrations/202611080001_initial_schema.sql` with the Supabase CLI or SQL editor.
3. Create a private R2 bucket named `mementoroll-private`, disable public access, configure its CORS policy to permit `PUT` from `NEXT_PUBLIC_APP_URL`, and add the R2 S3 credentials.
4. Configure Supabase Auth email verification and add `/auth/callback` to the allowed redirect URLs.
5. Run `npm run dev`.

`TEST_PAYMENT_MODE=true` creates explicitly labeled development entitlements. Keep it `false` in production. A production payment adapter must verify signed, idempotent webhooks before marking an order paid.

## Security boundaries

- Browser users use the Supabase publishable key and RLS. The secret key is imported only by server modules.
- Event and session tokens are HMAC-SHA256 hashes at rest; event PINs use Argon2id.
- The guest cookie is HttpOnly, SameSite=Lax, and Secure in production.
- Uploads are reserved atomically in PostgreSQL, sent to private R2 with a five-minute signed URL, decoded by Sharp, stripped of metadata, converted to WebP, and only then finalized.
- Gallery URLs are temporary and owner-scoped. No object key is accepted from a browser download request.

## Validation

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Database policy tests in `supabase/tests` require a local Supabase CLI environment. Real camera, R2, email, payment, and concurrency validation require configured external services and HTTPS-capable mobile browsers.
