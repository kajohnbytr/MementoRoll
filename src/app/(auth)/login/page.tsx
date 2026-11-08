import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <><p className="eyebrow">Welcome back</p><h1 className="font-display mt-3 text-5xl">Your moments are waiting.</h1><p className="mt-4 text-[#686861]">Log in to manage events and revisit every frame.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-[#a63d40]">{error === "invalid_request" ? "The login request was rejected. Refresh the page and try again." : "The email or password was incorrect."}</p>}<AuthForm mode="login" /><div className="mt-6 flex justify-between text-sm"><Link className="font-bold underline underline-offset-4" href="/forgot-password">Forgot password?</Link><span>New here? <Link className="font-bold underline underline-offset-4" href="/register">Create account</Link></span></div></>;
}
