import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().default("mementoroll-private"),
  R2_ENDPOINT: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32),
  TOKEN_HASH_SECRET: z.string().min(32),
  TEST_PAYMENT_MODE: z.enum(["true", "false"]).default("false"),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}

export function hasStorageConfig() {
  const value = env();
  return Boolean(value.R2_ACCESS_KEY_ID && value.R2_SECRET_ACCESS_KEY && value.R2_ENDPOINT);
}
