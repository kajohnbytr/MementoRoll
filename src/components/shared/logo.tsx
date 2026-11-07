import Link from "next/link";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return <Link href="/" aria-label="MementoRoll home" className={`inline-flex items-center gap-2 font-bold tracking-[-.03em] ${inverse ? "text-white" : "text-[#292a26]"}`}>
    <span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full border-2 ${inverse ? "border-white" : "border-[#292a26]"}`}><span className="h-2.5 w-2.5 rounded-full bg-[#b87960]" /></span>
    MementoRoll
  </Link>;
}
