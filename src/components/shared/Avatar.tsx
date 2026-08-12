import { cn } from "@/lib/utils";
import { avatarColors, initials } from "@/lib/utils/avatar";

interface AvatarProps {
  name: string;
  size?: number;
  square?: boolean;
  className?: string;
  ringWhite?: boolean;
}

export function ColoredAvatar({ name, size = 40, square, className, ringWhite }: AvatarProps) {
  const { bg, fg } = avatarColors(name);
  return (
    <div
      className={cn(
        "shrink-0 grid place-items-center font-semibold",
        square ? "rounded-lg" : "rounded-full",
        ringWhite && "ring-[3px] ring-white",
        className,
      )}
      style={{
        width: size, height: size, background: bg, color: fg,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials(name)}
    </div>
  );
}

export function PrimaryIconBadge({
  children, size = 40, className,
}: { children: React.ReactNode; size?: number; className?: string }) {
  return (
    <div
      className={cn("rounded-lg grid place-items-center shrink-0", className)}
      style={{
        width: size, height: size,
        background: "hsl(var(--primary) / 0.07)",
        color: "hsl(var(--primary))",
      }}
    >
      {children}
    </div>
  );
}
