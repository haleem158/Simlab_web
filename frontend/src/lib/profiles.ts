import { useSyncExternalStore } from "react";
import type { VestingParams } from "./types";

/* Saved vesting profiles live in this browser only (localStorage). Nobody else can see or delete them. */

export interface SavedProfile {
  id: string;
  name: string;
  created_at: string;
  params: VestingParams;
}

const KEY = "simlab:vesting-profiles:v1";
const MAX = 20;
const EMPTY: SavedProfile[] = [];
const listeners = new Set<() => void>();
let cacheRaw: string | null = null;
let cacheVal: SavedProfile[] = EMPTY;

function read(): SavedProfile[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    cacheVal = raw ? (JSON.parse(raw) as SavedProfile[]) : EMPTY;
  } catch {
    cacheVal = EMPTY;
  }
  return cacheVal;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProfiles(): SavedProfile[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

function write(list: SavedProfile[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}

/** Returns the saved profile, or null if the browser would not store it. */
export function saveProfile(
  name: string,
  params: VestingParams,
): SavedProfile | null {
  const rec: SavedProfile = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim().slice(0, 60) || "Untitled profile",
    created_at: new Date().toISOString(),
    params: JSON.parse(JSON.stringify(params)) as VestingParams,
  };
  return write([rec, ...read()].slice(0, MAX)) ? rec : null;
}

export function deleteProfile(id: string): void {
  write(read().filter((p) => p.id !== id));
}
