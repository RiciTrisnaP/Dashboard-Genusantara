"use client";

import { Search, X } from "lucide-react";

export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative w-full sm:max-w-md">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-3" strokeWidth={1.75} />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("");
        }}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-full border border-line bg-white py-2 pr-11 pl-11 text-base placeholder:text-ink-3 focus:border-primary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Hapus pencarian"
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:bg-canvas hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
