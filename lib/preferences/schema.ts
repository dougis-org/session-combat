// Typed, versioned user-preference schema. Shared by the client provider
// (lib/preferences/usePreferences.tsx), the API route (app/api/me/preferences),
// and the server storage helpers (lib/storage/userPreferencesRepo.ts).
//
// Only values that differ from DEFAULT_PREFERENCES are ever persisted (sparse
// deltas). resolvePreferences() always merges a stored delta onto the current
// defaults, so an older or partially-corrupt stored document degrades to
// defaults per-key instead of throwing.

export const PREFERENCES_SCHEMA_VERSION = 1;

/** Minimum dock height in px. Mirrored by lib/components/CampaignChat/useDockState.ts. */
export const DOCK_MIN_HEIGHT = 150;
/** Upper bound on a persisted dock height — guards against document bloat / absurd values. */
export const DOCK_MAX_HEIGHT = 10000;

/** Persisted chat-dock size. Carries the screen dimensions it was captured at so the
 *  consumer can ignore it when the viewport has changed materially. */
export interface DockSize {
  height: number;
  screenWidth: number;
  screenHeight: number;
}

export interface PreferenceValues {
  dice: {
    /** Auto-submit a roll to session chat when a session is present. */
    sendToChat: boolean;
    /** Tri-state: `true|false` once chosen, `null` = follow `prefers-reduced-motion`. */
    disableAnimation: boolean | null;
    /** Reserved slot for a future dice colour picker. Short hex string or `null`. */
    color: string | null;
  };
  chat: {
    pinned: boolean;
    /** Custom dock height, or `null` for the default. */
    size: DockSize | null;
  };
}

export const DEFAULT_PREFERENCES: PreferenceValues = Object.freeze({
  dice: Object.freeze({ sendToChat: false, disableAnimation: null, color: null }),
  chat: Object.freeze({ pinned: false, size: null }),
}) as PreferenceValues;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const isValidColor = (v: unknown): v is string | null =>
  v === null || (typeof v === "string" && HEX_COLOR.test(v));

const isValidDockSize = (v: unknown): v is DockSize => {
  if (!isPlainObject(v)) return false;
  return (
    isFiniteNumber(v.height) &&
    v.height >= DOCK_MIN_HEIGHT &&
    v.height <= DOCK_MAX_HEIGHT &&
    isFiniteNumber(v.screenWidth) &&
    v.screenWidth > 0 &&
    isFiniteNumber(v.screenHeight) &&
    v.screenHeight > 0
  );
};

const isValidDockSizeOrNull = (v: unknown): v is DockSize | null =>
  v === null || isValidDockSize(v);

/** Per-key validators used by both resolve (repair) and patch validation (reject). */
const KEY_VALIDATORS = {
  "dice.sendToChat": (v: unknown): v is boolean => typeof v === "boolean",
  "dice.disableAnimation": (v: unknown): v is boolean | null =>
    v === null || typeof v === "boolean",
  "dice.color": isValidColor,
  "chat.pinned": (v: unknown): v is boolean => typeof v === "boolean",
  "chat.size": isValidDockSizeOrNull,
} as const;

type KnownPath = keyof typeof KEY_VALIDATORS;

const KNOWN_PATHS = Object.keys(KEY_VALIDATORS) as KnownPath[];

const cloneDefaults = (): PreferenceValues => ({
  dice: { ...DEFAULT_PREFERENCES.dice },
  chat: { ...DEFAULT_PREFERENCES.chat },
});

const getPath = (obj: unknown, path: KnownPath): unknown => {
  if (!isPlainObject(obj)) return undefined;
  const [domain, key] = path.split(".") as [keyof PreferenceValues, string];
  const sub = obj[domain];
  return isPlainObject(sub) ? sub[key] : undefined;
};

const setPath = (target: PreferenceValues, path: KnownPath, value: unknown): void => {
  const [domain, key] = path.split(".") as [keyof PreferenceValues, string];
  (target[domain] as Record<string, unknown>)[key] = value;
};

/**
 * Merge a stored (possibly stale / partially corrupt) `values` delta onto the current
 * defaults. Unknown keys are dropped; wrongly-typed known keys fall back to their
 * default. Never throws.
 */
export function resolvePreferences(
  stored: unknown,
): PreferenceValues {
  const resolved = cloneDefaults();
  for (const path of KNOWN_PATHS) {
    const candidate = getPath(stored, path);
    if (candidate === undefined) continue;
    if (KEY_VALIDATORS[path](candidate)) {
      setPath(resolved, path, candidate);
    }
  }
  return resolved;
}

/**
 * Extract only the known, individually-valid keys from a stored/candidate object as a
 * sparse delta (no defaults filled in). Used to tell "the server has a stored value for
 * this key" apart from "this key is just the default".
 */
export function sparseKnownValues(source: unknown): DeepPartial<PreferenceValues> {
  const out: DeepPartial<PreferenceValues> = {};
  for (const path of KNOWN_PATHS) {
    const candidate = getPath(source, path);
    if (candidate === undefined || !KEY_VALIDATORS[path](candidate)) continue;
    const [domain, key] = path.split(".") as [keyof PreferenceValues, string];
    if (out[domain] === undefined) out[domain] = {} as Record<string, unknown>;
    (out[domain] as Record<string, unknown>)[key] = candidate;
  }
  return out;
}

/** Dotted known paths, e.g. "dice.sendToChat". */
export const PREFERENCE_PATHS = KNOWN_PATHS as readonly string[];

export type PreferencePatchResult =
  | { ok: true; values: DeepPartial<PreferenceValues> }
  | { ok: false; error: string };

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Validate a `PATCH /api/me/preferences` body before any write. Rejects non-object
 * bodies (array / null / primitive) up front, rejects wrongly-typed or out-of-range
 * known values, and strips unknown keys. Returns the sparse, validated delta.
 */
export function validatePreferencePatch(body: unknown): PreferencePatchResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Preference patch must be a JSON object" };
  }

  const values: DeepPartial<PreferenceValues> = {};
  let touched = false;

  for (const path of KNOWN_PATHS) {
    const candidate = getPath(body, path);
    if (candidate === undefined) continue;
    if (!KEY_VALIDATORS[path](candidate)) {
      return { ok: false, error: `Invalid value for preference "${path}"` };
    }
    const [domain, key] = path.split(".") as [keyof PreferenceValues, string];
    if (values[domain] === undefined) values[domain] = {} as Record<string, unknown>;
    (values[domain] as Record<string, unknown>)[key] = candidate;
    touched = true;
  }

  if (!touched) {
    return { ok: false, error: "Preference patch contains no known keys" };
  }

  return { ok: true, values };
}

/**
 * Split a (sparse) values delta into Mongo `$set` / `$unset` operand maps, keyed by
 * dotted `preferences.values.<path>`. A value equal to that key's schema default is
 * routed to `$unset` so only genuine non-default deltas are persisted.
 */
export function partitionPreferenceDelta(values: DeepPartial<PreferenceValues>): {
  set: Record<string, unknown>;
  unset: Record<string, "">;
} {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const path of KNOWN_PATHS) {
    const candidate = getPath(values, path);
    if (candidate === undefined) continue;
    const field = `preferences.values.${path}`;
    if (JSON.stringify(candidate) === JSON.stringify(getPath(DEFAULT_PREFERENCES, path))) {
      unset[field] = "";
    } else {
      set[field] = candidate;
    }
  }
  return { set, unset };
}
