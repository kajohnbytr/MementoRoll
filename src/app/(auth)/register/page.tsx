import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return <><p className="eyebrow">Start your first roll</p><h1 className="font-display mt-3 text-5xl">Create your event.</h1><p className="mt-4 text-[#686861]">Your account protects every event and private gallery you create.</p><AuthForm mode="register" /><p className="mt-6 text-center text-sm">Already have an account? <Link className="font-bold underline underline-offset-4" href="/login">Log in</Link></p></>;
}
