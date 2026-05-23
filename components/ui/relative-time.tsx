"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { formatDisplayDate } from "@/lib/assignments/format-date";

type RelativeTimeProps = {
  value: string;
  className?: string;
};

export function RelativeTime({ value, className }: RelativeTimeProps) {
  const staticLabel = formatDisplayDate(value);
  const [label, setLabel] = useState(staticLabel);

  useEffect(() => {
    setLabel(formatDistanceToNow(new Date(value), { addSuffix: true }));
  }, [value]);

  return <span className={className}>{label}</span>;
}
