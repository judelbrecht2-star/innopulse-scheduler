"use client";

import { Globe2 } from "lucide-react";
import { useMemo } from "react";

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const timeZones = useMemo(() => {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
    const supported = intl.supportedValuesOf?.("timeZone") ?? [
      "Africa/Johannesburg",
      "Europe/London",
      "America/New_York",
      "Asia/Dubai",
      "Australia/Sydney",
    ];
    return supported.includes(value) ? supported : [value, ...supported];
  }, [value]);
  return (
    <label className="flex max-w-sm items-center gap-2 rounded-pill border border-white/10 bg-[#272a26] px-4 text-sm text-white/60 transition-colors hover:border-primary/50 hover:bg-[#2d302b]"><Globe2 className="size-4 shrink-0 text-primary" />
      <span className="sr-only">Timezone</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer bg-transparent py-2 text-white/70 outline-none [color-scheme:dark] [&>option]:bg-[#181a17] [&>option]:text-white [&>option:checked]:bg-primary [&>option:checked]:text-[#171916]"
      >
        {timeZones.map((timeZone) => (
          <option key={timeZone} value={timeZone}>
            {timeZone.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
