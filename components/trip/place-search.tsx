"use client";

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

import { Input } from "@/components/ui/input";
import { searchPlaces, type GeocodingResult } from "@/lib/mapbox/geocoding";

interface PlaceSearchProps {
  onSelect: (place: GeocodingResult) => void;
  placeholder?: string;
}

export interface PlaceSearchRef {
  focus: () => void;
}

export const PlaceSearch = forwardRef<PlaceSearchRef, PlaceSearchProps>(
  function PlaceSearch(
    { onSelect, placeholder = "Search for a place..." },
    ref,
  ) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GeocodingResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
      const timer = setTimeout(async () => {
        if (query.length >= 2) {
          setIsLoading(true);
          const places = await searchPlaces(query);
          setResults(places);
          setIsOpen(true);
          setIsLoading(false);
        } else {
          setResults([]);
          setIsOpen(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (place: GeocodingResult) => {
      onSelect(place);
      setQuery("");
      setResults([]);
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background shadow-lg">
            {results.map((place) => (
              <button
                key={place.id}
                onClick={() => handleSelect(place)}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted"
              >
                <span className="font-medium">{place.name}</span>
                <span className="text-sm text-muted-foreground">
                  {place.fullName}
                </span>
              </button>
            ))}
          </div>
        )}

        {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-background p-3 text-sm text-muted-foreground shadow-lg">
            No places found
          </div>
        )}
      </div>
    );
  },
);
