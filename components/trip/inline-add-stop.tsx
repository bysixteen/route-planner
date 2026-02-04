"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox/geocoding";

interface InlineAddStopProps {
  onSelect: (place: GeocodingResult) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function InlineAddStop({
  onSelect,
  onCancel,
  placeholder = "Search for a place...",
}: InlineAddStopProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search as user types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        const places = await searchPlaces(query);
        setResults(places);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (place: GeocodingResult) => {
    onSelect(place);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="rounded-lg border-2 border-primary bg-background p-3 shadow-lg">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pr-8"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onCancel();
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border">
          {results.map((place) => (
            <button
              key={place.id}
              onClick={() => handleSelect(place)}
              className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
            >
              <span className="font-medium">{place.name}</span>
              <span className="text-xs text-muted-foreground">
                {place.fullName}
              </span>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !isLoading && (
        <p className="mt-2 text-sm text-muted-foreground">No places found</p>
      )}

      <div className="mt-2 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
