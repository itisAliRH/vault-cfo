"use client";

import { Button } from "@/components/ui/button";

const RANGES = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
] as const;

interface TimeRangeSelectorProps {
  value: number;
  onChange: (months: number) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <Button
          key={r.label}
          size="sm"
          variant={value === r.months ? "default" : "outline"}
          className="font-pixel text-[10px] h-7 px-2"
          onClick={() => onChange(r.months)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
