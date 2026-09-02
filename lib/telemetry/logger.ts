import { metrics, trace, SpanStatusCode } from "@opentelemetry/api";

export type StorageEventOutcome = "success" | "not_found" | "error";

interface BaseStorageEvent {
  name: string;
  collection: string;
  durationMs: number;
}

export interface SuccessStorageEvent extends BaseStorageEvent {
  outcome: "success" | "not_found";
}

export interface ErrorStorageEvent extends BaseStorageEvent {
  outcome: "error";
  error: unknown;
}

export type StorageEvent = SuccessStorageEvent | ErrorStorageEvent;

const meter = metrics.getMeter("session-combat");
const tracer = trace.getTracer("session-combat");
const storageOpsCounter = meter.createCounter("storage.ops");

export function logStorageEvent(event: StorageEvent): void {
  // Emit counter
  storageOpsCounter.add(1, {
    name: event.name,
    collection: event.collection,
    outcome: event.outcome,
  });

  // Emit span retroactively
  const endTime = Date.now();
  const startTime = endTime - event.durationMs;

  const span = tracer.startSpan(`storage.${event.collection}.${event.name}`, {
    startTime,
  });

  if (event.outcome === "error") {
    span.setStatus({ code: SpanStatusCode.ERROR });
    if (event.error instanceof Error) {
      span.recordException(event.error);
    } else if (event.error !== undefined) {
      span.recordException(new Error(String(event.error)));
    }
  }

  span.end(endTime);

  // Console logging fallback
  if (process.env.NODE_ENV === "development") {
    if (event.outcome === "error") {
      console.error(event);
    } else {
      console.log(event);
    }
  }
}
