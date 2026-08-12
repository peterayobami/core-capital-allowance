import { cn } from "@/lib/utils";

interface ShimmerProps {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
}

export function ShimmerBox({ width, height = 16, rounded = "rounded-md", className }: ShimmerProps) {
  return (
    <div
      className={cn("shimmer-box", rounded, className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

export function LinearProgress({ active }: { active: boolean }) {
  return (
    <div className="h-0.5 w-full overflow-hidden bg-transparent">
      {active && (
        <div className="h-full w-1/3 bg-primary animate-[cl-bar_1.2s_infinite_ease-in-out]" />
      )}
      <style>{`@keyframes cl-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }`}</style>
    </div>
  );
}
