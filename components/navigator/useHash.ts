"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** Current URL hash without "#"; empty during prerender. Used for deep links such as #persetujuan. */
export function useHash(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => "",
  );
}
