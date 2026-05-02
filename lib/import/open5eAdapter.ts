const OPEN5E_API_BASE = "https://api.open5e.com/v2";
const ALLOWED_HOST = "api.open5e.com";

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.hostname !== ALLOWED_HOST) {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    if (parsed.hash && parsed.hash.includes("@")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export interface Open5ECreature {
  key: string;
  name: string;
  size: { Name: string; key: string };
  type: { Name: string; key: string };
  alignment?: string;
  speed: { walk?: number; swim?: number; fly?: number; unit?: string; [key: string]: unknown };
  ability_scores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hit_points: number;
  armor_class: number;
  challenge_rating: number;
  actions: Array<{ name: string; desc: string }>;
  traits?: Array<{ name: string; desc: string }>;
}

export interface Open5ESpell {
  key: string;
  name: string;
  level: number;
  school: { Name: string; key: string };
  concentration: boolean;
  casting_time: string;
  range: number;
  range_text: string;
  duration: string;
  verbal?: boolean;
  somatic?: boolean;
  material?: boolean;
  material_specified?: string;
  desc: string;
  higher_level?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

async function fetchWithBackoff(
  fetchFn: typeof fetch,
  url: string,
  retries = 3
): Promise<Response> {
  if (!isAllowedUrl(url)) {
    throw new Error(`URL host not allowed: ${url}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchFn(url);

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        let backoffMs: number;
        if (retryAfter) {
          backoffMs = Math.min(parseInt(retryAfter, 10) * 1000, 10000);
        } else {
          backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        }

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
        return response;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function fetchPage<T>(
  fetchFn: typeof fetch,
  endpoint: string,
  page = 1
): Promise<PaginatedResponse<T>> {
  const response = await fetchWithBackoff(
    fetchFn,
    `${OPEN5E_API_BASE}/${endpoint}/?page=${page}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export interface IOpen5EClient {
  fetchMonsters(page?: number): Promise<PaginatedResponse<Open5ECreature>>;
  fetchSpells(page?: number): Promise<PaginatedResponse<Open5ESpell>>;
  getAllMonsters(): AsyncGenerator<Open5ECreature, void, unknown>;
  getAllSpells(): AsyncGenerator<Open5ESpell, void, unknown>;
}

export class Open5EClient implements IOpen5EClient {
  private fetcher: typeof fetch;

  constructor(fetchFn: typeof fetch = fetch) {
    this.fetcher = fetchFn;
  }

  async fetchMonsters(
    page = 1
  ): Promise<PaginatedResponse<Open5ECreature>> {
    return fetchPage<Open5ECreature>(this.fetcher, "creatures", page);
  }

  async fetchSpells(
    page = 1
  ): Promise<PaginatedResponse<Open5ESpell>> {
    return fetchPage<Open5ESpell>(this.fetcher, "spells", page);
  }

  private async *fetchAllPages<T>(
    fetcher: (page: number) => Promise<PaginatedResponse<T>>
  ): AsyncGenerator<T, void, unknown> {
    let currentPage = 1;

    while (true) {
      const data = await fetcher(currentPage);
      for (const item of data.results) {
        yield item;
      }

      if (!data.next) {
        break;
      }
      currentPage++;
    }
  }

  async *getAllMonsters(): AsyncGenerator<Open5ECreature, void, unknown> {
    yield* this.fetchAllPages((page) => this.fetchMonsters(page));
  }

  async *getAllSpells(): AsyncGenerator<Open5ESpell, void, unknown> {
    yield* this.fetchAllPages((page) => this.fetchSpells(page));
  }
}

export const defaultOpen5EClient = new Open5EClient();

export async function fetchMonsters(
  page = 1
): Promise<PaginatedResponse<Open5ECreature>> {
  return defaultOpen5EClient.fetchMonsters(page);
}

export async function fetchSpells(
  page = 1
): Promise<PaginatedResponse<Open5ESpell>> {
  return defaultOpen5EClient.fetchSpells(page);
}

export async function* getAllMonsters(): AsyncGenerator<
  Open5ECreature,
  void,
  unknown
> {
  yield* defaultOpen5EClient.getAllMonsters();
}

export async function* getAllSpells(): AsyncGenerator<
  Open5ESpell,
  void,
  unknown
> {
  yield* defaultOpen5EClient.getAllSpells();
}