import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface PhasePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  phase: string;
  icon: LucideIcon;
}

export function PhasePlaceholder({ eyebrow, title, description, phase, icon: Icon }: PhasePlaceholderProps) {
  return (
    <main className="p-5 md:p-8">
      <p className="ip-eyebrow">{eyebrow}</p>
      <h1 className="text-3xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      <Card className="mt-8 max-w-2xl border-dashed shadow-none">
        <CardContent className="flex items-start gap-4 p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-button bg-muted text-brand-green">
            <Icon className="size-5" />
          </span>
          <div>
            <p className="font-medium">Scheduled for {phase}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The Phase 1 data and authentication foundation for this area is already in place.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
