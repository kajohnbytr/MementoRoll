"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const formSchema = z.object({ email: z.email(), password: z.string().min(8), fullName: z.string().trim().max(120).optional() });
type Fields = z.infer<typeof formSchema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Fields>({ resolver: zodResolver(formSchema) });

  async function submit(values: Fields) {
    setMessage(undefined);
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "register") {
        if (!values.fullName || values.fullName.length < 2) { setError("fullName", { message: "Enter your full name" }); return; }
        const { error } = await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { full_name: values.fullName }, emailRedirectTo: `${location.origin}/auth/callback` } });
        if (error) throw error;
        setMessage("Check your email to verify your account, then return to log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) throw error;
        router.push("/dashboard"); router.refresh();
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again."); }
  }

  return <form
    action={mode === "login" ? "/api/auth/login" : "/api/auth/register"}
    method="post"
    onSubmit={handleSubmit(submit)}
    className="mt-8 space-y-5"
    noValidate
  >
    {mode === "register" && <div><label className="label" htmlFor="fullName">Full name</label><input className="field" id="fullName" autoComplete="name" {...register("fullName")} />{errors.fullName && <p className="mt-1 text-sm text-[#a63d40]">{errors.fullName.message}</p>}</div>}
    <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" type="email" autoComplete="email" {...register("email")} />{errors.email && <p className="mt-1 text-sm text-[#a63d40]">{errors.email.message}</p>}</div>
    <div><label className="label" htmlFor="password">Password</label><div className="relative"><input className="field !pr-14" id="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute inset-y-0 right-1 grid min-h-11 min-w-11 place-items-center rounded-lg text-[#686861] hover:bg-[#f3efe6]">{showPassword ? <EyeOff aria-hidden="true" size={20}/> : <Eye aria-hidden="true" size={20}/>}</button></div><p className="mt-1 text-xs text-[#777b61]">At least 8 characters. Password managers and paste are supported.</p>{errors.password && <p className="mt-1 text-sm text-[#a63d40]">{errors.password.message}</p>}</div>
    {message && <div role="status" className="rounded-xl border border-[#d8ccb8] bg-[#f3efe6] p-3 text-sm">{message}</div>}
    <button disabled={isSubmitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <>{mode === "login" ? "Log in" : "Create account"}<ArrowRight aria-hidden="true" size={18} /></>}</button>
  </form>;
}
