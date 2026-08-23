export type StorageEventOutcome = "success" | "not_found" | "error";

export interface StorageEvent {
  name: string;
  collection: string;
  outcome: StorageEventOutcome;
  durationMs: number;
  error?: unknown;
}

export function logStorageEvent(event: StorageEvent): void {
  if (event.outcome === "error") {
    console.error(event);
    return;
  }
  console.log(event);
}
