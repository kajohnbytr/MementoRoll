import { Aperture, BatteryMedium, Images, Zap } from "lucide-react";

export function CameraMockup() {
  return <div className="camera-grain relative mx-auto aspect-[4/3] w-full max-w-[560px] rotate-[-2deg] overflow-hidden rounded-[2rem] border border-black/20 bg-[#292a26] p-5 text-white shadow-[0_32px_80px_rgba(41,42,38,.25)] sm:p-8">
    <div className="flex items-center justify-between text-xs font-bold tracking-[.18em]"><span>MEMENTO 25</span><BatteryMedium aria-hidden="true" size={22} /></div>
    <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 sm:mt-8 sm:gap-8">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-[6px] border-[#11120f] bg-[radial-gradient(circle_at_65%_40%,#a9b29c_0,#596358_35%,#222720_70%)]">
        <div className="absolute inset-0 bg-[linear-gradient(130deg,transparent_45%,rgba(255,255,255,.13)_46%,transparent_58%)]" />
        <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[10px] tracking-widest">LIVE</div>
      </div>
      <div className="flex flex-col items-center justify-between py-2">
        <Zap aria-hidden="true" size={20} className="text-[#d8ccb8]" />
        <button aria-label="Camera shutter preview" className="grid h-16 w-16 cursor-pointer place-items-center rounded-full border-[5px] border-[#d8ccb8] bg-[#b87960] shadow-inner sm:h-20 sm:w-20"><Aperture aria-hidden="true" size={30} /></button>
        <Images aria-hidden="true" size={20} className="text-[#d8ccb8]" />
      </div>
    </div>
    <div className="mt-5 flex items-center justify-between text-xs text-white/65"><span>REAR CAMERA</span><span className="text-lg font-bold text-white">25 / 25</span></div>
  </div>;
}
