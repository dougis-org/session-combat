import { v4 as uuidv4 } from "uuid";

type IsolationInput = {
  workerIndex: number;
  retry: number;
  title: string;
};

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || "test";
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