// Add custom matchers or setup code here

// Polyfill crypto.randomUUID for jsdom environment
if (typeof global.crypto === 'undefined' || !global.crypto.randomUUID) {
  // Prefer native crypto.randomUUID when available; otherwise provide a
  // lightweight fallback for the test environment to avoid relying on
  // CommonJS `require` in ESM contexts.
  const randomUUID = (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.randomUUID)
    ? globalThis.crypto.randomUUID.bind(globalThis.crypto)
    : () => `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  global.crypto = {
    ...global.crypto,
    randomUUID
  };
}

// Polyfill Request and Response for Next.js route handlers
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
  };
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers }
      });
    }
  };
}
