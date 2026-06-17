import { Card } from "../../components/ui/Card";

interface DisplayCardProps {
  text: string;
}

export function DisplayCard({ text }: DisplayCardProps) {
  return (
    <Card className="overflow-hidden bg-neutral-950 p-0 text-white">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-mono text-[11px] font-bold text-mint-300">SHOW MODE</p>
            <h3 className="mt-1 text-lg font-black">展示给对方看</h3>
          </div>
          <span className="h-3 w-3 rounded-full bg-mint-300 animate-quiet-glow" />
        </div>
      </div>

      <div className="flex min-h-[13rem] items-center justify-center px-5 py-8 text-center">
        <p className="text-[clamp(1.65rem,9vw,3.4rem)] font-black leading-tight tracking-[-0.01em]">
          {text}
        </p>
      </div>

      <div className="grid grid-cols-3 border-t border-white/10 text-center">
        <div className="px-2 py-3">
          <p className="label-mono text-[10px] font-bold text-white/45">READ</p>
          <p className="text-xs font-semibold text-white/80">高对比</p>
        </div>
        <div className="border-x border-white/10 px-2 py-3">
          <p className="label-mono text-[10px] font-bold text-white/45">HAND</p>
          <p className="text-xs font-semibold text-white/80">可递给对方</p>
        </div>
        <div className="px-2 py-3">
          <p className="label-mono text-[10px] font-bold text-white/45">TAP</p>
          <p className="text-xs font-semibold text-white/80">点击短句更新</p>
        </div>
      </div>
    </Card>
  );
}
