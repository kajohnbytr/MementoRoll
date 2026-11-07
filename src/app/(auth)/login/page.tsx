import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return <><p className="eyebrow">Welcome back</p><h1 className="font-display mt-3 text-5xl">Your moments are waiting.</h1><p className="mt-4 text-[#686861]">Log in to manage events and revisit every frame.</p><AuthForm mode="login" /><div className="mt-6 flex justify-between text-sm"><Link className="font-bold underline underline-offset-4" href="/forgot-password">Forgot password?</Link><span>New here? <Link className="font-bold underline underline-offset-4" href="/register">Create account</Link></span></div></>;
}
