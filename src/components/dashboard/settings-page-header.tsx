import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function SettingsPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <Link href="/dashboard/settings" className="mb-6 inline-flex items-center gap-2 rounded-pill border border-black/[0.07] bg-white px-3.5 py-2 text-xs font-medium text-muted-foreground transition-[border-color,color,transform] hover:-translate-x-0.5 hover:border-brand-green/40 hover:text-foreground">
        <ArrowLeft className="size-4" /> All settings
      </Link>
      <p className="ip-eyebrow">{eyebrow}</p>
      <h1 className="text-3xl">{title}{title.endsWith(".") ? "" : "."}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
