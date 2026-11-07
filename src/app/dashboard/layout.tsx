import { Sidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-screen bg-[#faf9f6]"><Sidebar /><main className="p-5 sm:p-8 lg:ml-64 lg:p-10">{children}</main></div>;
}
