import { Card } from "../../components/ui/Card";

interface DisplayCardProps {
  text: string;
  step?: number;
}

export function DisplayCard({ text, step = 1 }: DisplayCardProps) {
  return (
    <div className="animate-step-enter" style={{ animationDelay: `${(step - 1) * 80}ms` }}>
      <Card
        variant="bare"
        className="isolate overflow-hidden rounded-[1.6rem] bg-[#0f1513] p-0 text-white shadow-[0_26px_70px_rgba(15,21,19,0.28)] ring-1 ring-black/10"
      >
        <div className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-500 text-sm font-black text-white">
                {step}
              </div>
              <div>
                <p className="label-mono text-[11px] font-bold text-mint-200/90">STEP {step}</p>
                <h3 className="mt-0.5 text-lg font-black tracking-normal">给对方看</h3>
              </div>
            </div>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
              <span className="h-3 w-3 rounded-full bg-mint-300 animate-quiet-glow" />
            </span>
          </div>
        </div>

        <div className="relative flex min-h-[12rem] items-center justify-center overflow-hidden px-5 py-8 text-center sm:min-h-[14rem]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(94,234,212,0.16),transparent_18rem),linear-gradient(160deg,#131f1c_0%,#0f1513_48%,#080b0a_100%)]" />
          <div className="absolute inset-x-6 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-mint-200/50 to-transparent" />
          <p className="max-w-[14ch] text-3xl font-black leading-[1.12] tracking-normal text-white drop-shadow-[0_2px_18px_rgba(255,255,255,0.18)] sm:text-4xl">
            {text}
          </p>
        </div>

        <div className="grid grid-cols-3 border-t border-white/10 bg-black/24 text-center">
          <div className="px-2 py-3.5">
            <p className="label-mono text-[10px] font-bold text-mint-100/70">READ</p>
            <p className="mt-1 text-[13px] font-bold text-white">高对比</p>
          </div>
          <div className="border-x border-white/10 px-2 py-3.5">
            <p className="label-mono text-[10px] font-bold text-mint-100/70">HAND</p>
            <p className="mt-1 text-[13px] font-bold text-white">可递给对方</p>
          </div>
          <div className="px-2 py-3.5">
            <p className="label-mono text-[10px] font-bold text-mint-100/70">TAP</p>
            <p className="mt-1 text-[13px] font-bold text-white">短句更新</p>
          </div>
        </div>
      </Card>
    </div>
  );
}