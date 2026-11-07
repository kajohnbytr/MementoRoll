import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen bg-[#f3efe6] lg:grid-cols-[1fr_1.05fr]"><section className="flex flex-col p-6 sm:p-10"><Logo /><div className="m-auto w-full max-w-md py-12">{children}</div></section><aside className="camera-grain relative hidden overflow-hidden bg-[#292a26] p-14 text-white lg:flex lg:flex-col lg:justify-between"><p className="eyebrow !text-[#d8ccb8]">A new perspective on your day</p><blockquote className="font-display max-w-xl text-6xl leading-[1.03]">“The photographs you treasure most are often the ones you never saw being taken.”</blockquote><div className="flex gap-3"><span className="h-3 w-3 rounded-full bg-[#b87960]" /><span className="h-3 w-3 rounded-full bg-[#777b61]" /><span className="h-3 w-3 rounded-full bg-[#d8ccb8]" /></div></aside></main>;
}
