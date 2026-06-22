import Image from "next/image";
import Link from "next/link";

export function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="InnoPulse Scheduling home">
      <span className="flex h-10 w-16 items-center justify-center rounded-[11px] bg-white p-1.5 shadow-card">
        <Image src="/branding/innopulse-growth-arrows.png" alt="" width={647} height={385} className="h-full w-full object-contain" priority />
      </span>
      <span>
        <span className="block text-sm font-semibold leading-4">InnoPulse</span>
        <span className="block text-xs text-muted-foreground">by The Growth System</span>
      </span>
    </Link>
  );
}
