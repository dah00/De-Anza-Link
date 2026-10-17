"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type Suggestion = { address: string };

export function AddressSearch({
  value,
  onType,
  onPick,
  onLookupFailed,
}: {
  value: string;
  onType: (value: string) => void;
  onPick: (suggestion: Suggestion) => void;
  onLookupFailed: () => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const failedRef = useRef(onLookupFailed);

  useEffect(() => {
    failedRef.current = onLookupFailed;
  }, [onLookupFailed]);

  const ready = query.trim().length >= 6 && /\d/.test(query);

  useEffect(() => {
    if (!ready) {
      setSuggestions([]);
      setLoading(false);
      setLookupError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/address-suggest?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const data: { addresses?: string[]; error?: string } = await res.json();
        if (!res.ok || data.error) {
          setSuggestions([]);
          setLookupError("Couldn't look up addresses. You can type one.");
          failedRef.current();
        } else {
          setSuggestions((data.addresses ?? []).map((address) => ({ address })));
          setLookupError(null);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setSuggestions([]);
        setLookupError("Couldn't look up addresses. You can type one.");
        failedRef.current();
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, ready]);

  const showList = open && ready;

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onType(e.target.value);
          setQuery(e.target.value);
          setLoading(true);
          setOpen(true);
          setLookupError(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="e.g. 22350 Homestead"
        aria-label="Address"
        autoComplete="off"
        maxLength={200}
        required
        role="combobox"
        aria-expanded={showList}
        aria-controls="address-suggestions"
      />
      {showList && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-[60] mt-1 overflow-hidden rounded-md border bg-card shadow-sm"
        >
          {lookupError ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {lookupError}
            </li>
          ) : suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {loading
                ? "Searching..."
                : "No matching street address. Keep typing the street name."}
            </li>
          ) : (
            suggestions.map((s) => (
              <li key={s.address} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(s);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                >
                  {s.address}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
