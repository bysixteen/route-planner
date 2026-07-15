"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";

import { buildMapsUrl } from "@/lib/maps-link";
import { cn } from "@/lib/utils";

/**
 * Primary "Navigate" CTA — one tap into the device's maps app with directions
 * to the stop. Href is resolved on the client (it's UA-dependent) to avoid a
 * hydration mismatch.
 */
export function NavigateButton({
  lat,
  lng,
  label,
  className,
}: {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
}) {
  const [href, setHref] = useState("");
  useEffect(() => {
    setHref(buildMapsUrl(lat, lng, label));
  }, [lat, lng, label]);

  return (
    <a
      href={href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "focus-ring inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-volt px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-volt-bright",
        className,
      )}
    >
      <Navigation className="size-3.5" /> Navigate
    </a>
  );
}
