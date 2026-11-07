import { Logo } from "@/components/shared/logo";

export default function ForgotPage() {
  return <><p className="eyebrow">Account recovery</p><h1 className="font-display mt-3 text-5xl">Reset your password.</h1><p className="mt-4 text-[#686861]">Password reset is handled securely by Supabase Auth.</p><form action="/api/auth/forgot-password" method="post" className="mt-8 space-y-5"><div><label className="label" htmlFor="email">Email address</label><input required className="field" type="email" id="email" name="email" autoComplete="email" /></div><button className="btn-primary w-full">Send reset link</button></form><div className="mt-8"><Logo /></div></>;
}
