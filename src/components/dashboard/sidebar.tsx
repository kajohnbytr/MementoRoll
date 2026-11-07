import Link from "next/link";
import { CalendarDays, CreditCard, HardDrive, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/shared/logo";

const links = [["Overview", "/dashboard", LayoutDashboard], ["My Events", "/dashboard/events", CalendarDays], ["Storage", "/dashboard/storage", HardDrive], ["Billing", "/dashboard/billing", CreditCard], ["Settings", "/dashboard/settings", Settings]] as const;
export function Sidebar() {
  return <aside className="border-b border-[#ded8cc] bg-[#f3efe6] lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r"><div className="flex h-full flex-col p-5"><Logo /><nav className="mt-8 flex gap-1 overflow-x-auto lg:flex-col" aria-label="Dashboard">{links.map(([label, href, Icon]) => <Link key={href} href={href} className="flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-bold hover:bg-white/70"><Icon aria-hidden="true" size={19} />{label}</Link>)}</nav><form className="mt-auto hidden lg:block" action="/api/auth/logout" method="post"><button className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-bold hover:bg-white/70"><LogOut aria-hidden="true" size={19} />Log out</button></form></div></aside>;
}
