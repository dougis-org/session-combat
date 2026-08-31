/**
 * Minimal synchronous stand-in for the Fetch `Response`, used by unit tests to
 * build fake `fetch` return values.
 *
 * Deliberately tiny. The real WHATWG `Response` (previously pulled in via
 * `node-fetch`, and in jsdom only available through a polyfill) backs its body
 * with a `ReadableStream` whose scheduling deadlocks under Jest fake timers.
 * These tests only ever read `status`, `ok`, `headers.get()`, `json()` and
 * `text()`, so that is all this implements.
 */
class MockHeaders {
  private readonly map = new Map<string, string>();

  constructor(init: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(init)) {
      this.map.set(key.toLowerCase(), value);
    }
  }

  get(name: string): string | null {
    return this.map.get(name.toLowerCase()) ?? null;
  }
}

export class MockFetchResponse {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: MockHeaders;
  private readonly body: string;

  constructor(
    body: string,
    init: { status?: number; headers?: Record<string, string> } = {},
  ) {
    this.body = body;
    this.status = init.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new MockHeaders(init.headers);
  }

  async json(): Promise<unknown> {
    return JSON.parse(this.body);
  }

  async text(): Promise<string> {
    return this.body;
  }
}
