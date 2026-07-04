import { avatarColorFor, initialsOf } from "@/lib/giftmind/constants";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function PersonAvatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const bg = color || avatarColorFor(name);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-serif font-semibold text-white shadow-sm ring-1 ring-black/5 select-none",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initialsOf(name)}
    </span>
  );
}
