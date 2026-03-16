import { createHash } from "node:crypto";
import type { TestInfo } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

type IsolationInput = Pick<TestInfo, "workerIndex" | "retry" | "title">;

function slugify(value: string): string {
  const hash = createHash("sha1").update(value).digest("hex").slice(0, 7);
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  const slug = normalized || "test";
  return `${slug}-${hash}`;
}

export function buildTestNamespace({
  workerIndex,
  retry,
  title,
}: IsolationInput): string {
  return `w${workerIndex}-r${retry}-${slugify(title)}`;
}

export function scopedValue(base: string, namespace: string): string {
  return `${base} [${namespace}]`;
}

export function createTestIdentity(input: IsolationInput) {
  const namespace = buildTestNamespace(input);
  const token = uuidv4().replace(/-/g, "");

  return {
    namespace,
    email: `${namespace}-${token}@example.com`,
    name: (base: string) => scopedValue(base, namespace),
  };
}
