"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "dentyvo.sidebar-recolhida";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

/** Preferência de sidebar recolhida (tablet/desktop), persistida em localStorage. */
export function useSidebarRecolhida() {
  const recolhida = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggleRecolhida = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, recolhida ? "0" : "1");
    } catch {
      // storage indisponível
    }
    emit();
  }, [recolhida]);

  return { recolhida, toggleRecolhida };
}
