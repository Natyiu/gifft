import { cn } from "@/lib/utils";

export function GiftBanner({ className }: { className?: string }) {
  return (
    <div className={cn("w-full overflow-hidden rounded-[24px]", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner.png"
        alt="Gifting illustrations"
        className="max-h-[230px] w-full object-cover"
      />
    </div>
  );
}
