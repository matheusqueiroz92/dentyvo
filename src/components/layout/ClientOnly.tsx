"use client";

import { useSyncExternalStore, type ReactNode } from "react";

function subscribe() {
  return () => undefined;
}

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** Evita SSR de subárvores que dependem só do cliente (ex.: polling). */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const isClient = useIsClient();
  if (!isClient) return fallback;
  return children;
}
