const OPEN5E_API_BASE = "https://api.open5e.com/v2";

interface Open5ECreature {
  slug: string;
  name: string;
  size: string;
  type: string;
  alignment: string;
  speed: Record<string, string | number>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hit_points: number;
  armor_class: Array<{ ac: number; note?: string }>;
  challenge_rating: string;
  actions: Array<{ name: string; desc: string }>;
  special_abilities?: Array<{ name: string; desc: string }>;
  legendary_actions?: Array<{ name: string; desc: string }>;
}

interface Open5ESpell {
  slug: string;
  name: string;
  level: number;
  school: string;
  concentration: boolean;
  casting_time: string;
  range: string;
  duration: string;
  components: string[];
  material?: string;
  description: string;
  higher_level?: string;
  damage_type?: string;
  dc_damage?: string;
  save_dc?: number;
  save_ability?: string;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

async function handleRateLimit(response: Response): Promise<Response> {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return response.clone();
  }
  return response;
}

async function fetchWithBackoff(url: string, retries = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        const handled = await handleRateLimit(response.clone());
        if (attempt < retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
        return handled;
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

export async function fetchMonsters(
  page = 1
): Promise<PaginatedResponse<Open5ECreature>> {
  const response = await fetchWithBackoff(
    `${OPEN5E_API_BASE}/creatures/?page=${page}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch monsters: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function fetchSpells(
  page = 1
): Promise<PaginatedResponse<Open5ESpell>> {
  const response = await fetchWithBackoff(
    `${OPEN5E_API_BASE}/spells/?page=${page}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch spells: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function* getAllMonsters(
  page = 1
): AsyncGenerator<Open5ECreature, void, unknown> {
  let currentPage = page;

  while (true) {
    const data = await fetchMonsters(currentPage);
    for (const creature of data.results) {
      yield creature;
    }

    if (!data.next) {
      break;
    }
    currentPage++;
  }
}

export async function* getAllSpells(
  page = 1
): AsyncGenerator<Open5ESpell, void, unknown> {
  let currentPage = page;

  while (true) {
    const data = await fetchSpells(currentPage);
    for (const spell of data.results) {
      yield spell;
    }

    if (!data.next) {
      break;
    }
    currentPage++;
  }
}

export type { Open5ECreature, Open5ESpell, PaginatedResponse };
