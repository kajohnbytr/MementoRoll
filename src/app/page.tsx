import Link from "next/link";
import { Aperture, ArrowRight, Check, Download, LockKeyhole, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { CameraMockup } from "@/components/marketing/camera-mockup";
import { Logo } from "@/components/shared/logo";

const features = [
  { icon: QrCode, title: "One scan away", body: "Share one QR code. Guests enter the private PIN and start capturing—no app download." },
  { icon: Aperture, title: "25 honest moments", body: "Every guest gets a fresh digital roll with 25 successfully saved photographs." },
  { icon: LockKeyhole, title: "Private by design", body: "Your event and photographs stay private, with short-lived access and owner-only galleries." },
  { icon: Download, title: "Keep every frame", body: "Browse, sort, and download individual photographs or request the entire collection." },
];
const steps = ["Create your event", "Share the QR and PIN", "Let guests capture", "Relive it all together"];
const plans = [
  ["Mini Roll", "5 GB", "Perfect for intimate celebrations"],
  ["Classic Roll", "20 GB", "Room for the whole guest list"],
  ["Premium Roll", "50 GB", "For the moments that keep coming"],
];

export default function Home() {
  return <main className="overflow-hidden bg-[#faf9f6]">
    <nav className="container-shell flex min-h-20 items-center justify-between" aria-label="Primary navigation">
      <Logo />
      <div className="hidden items-center gap-8 text-sm font-semibold md:flex"><a href="#how">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a></div>
      <div className="flex items-center gap-1 sm:gap-2"><Link className="inline-flex min-h-11 items-center px-2 text-xs font-bold sm:px-4 sm:text-sm" href="/login">Log in</Link><Link className="btn-primary !min-h-11 !px-3 text-xs sm:!px-4 sm:text-sm" href="/register"><span className="sm:hidden">Create</span><span className="hidden sm:inline">Create event</span><ArrowRight aria-hidden="true" size={16} /></Link></div>
    </nav>

    <section className="container-shell grid min-h-[720px] items-center gap-12 py-16 lg:grid-cols-[.88fr_1.12fr] lg:py-24">
      <div><p className="eyebrow mb-6">Your guests. Their perspective.</p><h1 className="font-display max-w-[700px] text-[clamp(3.4rem,7vw,6.7rem)] leading-[.91] tracking-[-.055em]">Every Moment Deserves a Frame.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#5f605a]">Give your guests a digital disposable camera and collect the candid moments that make your event unforgettable.</p><div className="mt-9 flex flex-wrap gap-3"><Link className="btn-primary" href="/register">Create Your Event <ArrowRight aria-hidden="true" size={18} /></Link><a className="btn-secondary" href="#how">See How It Works</a></div><p className="mt-5 flex items-center gap-2 text-sm text-[#777b61]"><ShieldCheck aria-hidden="true" size={17} /> Private gallery · No guest app needed</p></div>
      <div className="relative"><div className="absolute -left-10 -top-16 h-52 w-52 rounded-full bg-[#d8ccb8]/55 blur-3xl" /><CameraMockup /><p className="mt-8 text-center font-display text-xl italic text-[#777b61]">The best photographs are rarely posed.</p></div>
    </section>

    <section id="how" className="bg-[#292a26] py-24 text-white"><div className="container-shell"><p className="eyebrow !text-[#d8ccb8]">Four simple steps</p><div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end"><h2 className="font-display max-w-2xl text-4xl leading-tight sm:text-6xl">From QR code to camera roll.</h2><p className="max-w-md leading-7 text-white/60">No downloads, no accounts for guests, and no photographs scattered across group chats.</p></div><ol className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">{steps.map((step, i) => <li key={step} className="bg-[#292a26] p-7"><span className="font-display text-5xl text-[#b87960]">0{i + 1}</span><p className="mt-10 font-bold">{step}</p></li>)}</ol></div></section>

    <section id="features" className="container-shell py-24"><div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]"><div><p className="eyebrow">Made for real celebrations</p><h2 className="font-display mt-4 text-5xl leading-[1.02]">All the charm.<br />None of the film lab.</h2></div><div className="grid gap-4 sm:grid-cols-2">{features.map(({ icon: Icon, title, body }) => <article className="card p-7" key={title}><Icon aria-hidden="true" className="text-[#b87960]" /><h3 className="mt-10 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-[#686861]">{body}</p></article>)}</div></div></section>

    <section id="pricing" className="bg-[#f3efe6] py-24"><div className="container-shell"><div className="text-center"><p className="eyebrow">Simple event packages</p><h2 className="font-display mt-4 text-5xl">Choose your roll.</h2><p className="mx-auto mt-4 max-w-xl text-[#686861]">One event, one private collection, and 25 shots for every guest. Prices are loaded securely from the service at checkout.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{plans.map(([name, storage, body], i) => <article key={name} className={`rounded-3xl border p-7 ${i === 1 ? "border-[#292a26] bg-[#292a26] text-white" : "border-[#d6cbbb] bg-[#faf9f6]"}`}><p className={`eyebrow ${i === 1 ? "!text-[#d8ccb8]" : ""}`}>{name}</p><p className="font-display mt-6 text-5xl">{storage}</p><p className={`mt-3 ${i === 1 ? "text-white/65" : "text-[#686861]"}`}>{body}</p><ul className="mt-8 space-y-3 text-sm">{["25 shots per guest", "Private owner gallery", "ZIP collection export"].map(x => <li className="flex gap-2" key={x}><Check aria-hidden="true" size={18} className="text-[#b87960]" />{x}</li>)}</ul><Link className={`mt-9 w-full ${i === 1 ? "btn-secondary !border-white/30 !text-white hover:!bg-white/10" : "btn-primary"}`} href="/register">Select {name}</Link></article>)}</div></div></section>

    <section className="container-shell py-28 text-center"><Sparkles aria-hidden="true" className="mx-auto text-[#b87960]" /><h2 className="font-display mx-auto mt-5 max-w-3xl text-5xl leading-tight sm:text-7xl">See the day through everyone&apos;s eyes.</h2><p className="mx-auto mt-6 max-w-xl text-lg text-[#686861]">Your event deserves more than the few photographs everyone remembers to send.</p><Link className="btn-primary mt-9" href="/register">Create Your Event <ArrowRight aria-hidden="true" size={18} /></Link></section>
    <footer className="border-t border-[#ded8cc] py-10"><div className="container-shell flex flex-col items-center justify-between gap-5 sm:flex-row"><Logo /><p className="text-sm text-[#777b61]">© 2026 MementoRoll. Every frame, kept private.</p></div></footer>
  </main>;
}
