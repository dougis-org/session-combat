import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockFetchResponse } from "@/tests/unit/helpers/mockFetchResponse";
import MonsterImportPage from "@/app/monsters/import/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
}));

jest.mock("@/lib/components/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new MockFetchResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }) as unknown as Response;
}

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

// ─── Page scope: open5e sync only, no JSON upload form ───────────────────────

describe("MonsterImportPage — scope", () => {
  it("renders the open5e sync panel", () => {
    render(<MonsterImportPage />);
    expect(
      screen.getByRole("button", { name: /sync from open5e/i }),
    ).toBeInTheDocument();
  });

  it("no longer renders the 'Upload Monster JSON File' form", () => {
    render(<MonsterImportPage />);
    expect(screen.queryByText(/upload monster json file/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/select json file/i)).not.toBeInTheDocument();
  });
});

// ─── Sync response shape validation ──────────────────────────────────────────

describe("MonsterImportPage — sync response validation", () => {
  it("shows error when sync response lacks the monsters field", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(jsonResponse({ unexpected: true }, 200)) as typeof fetch;

    const user = userEvent.setup();
    render(<MonsterImportPage />);
    await user.click(screen.getByRole("button", { name: /sync from open5e/i }));

    expect(
      await screen.findByText(/unexpected sync response/i),
    ).toBeInTheDocument();
  });

  it("shows sync success message when response is valid", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ monsters: { inserted: 5, skipped: 2, errors: 0 } }, 200),
      ) as typeof fetch;

    const user = userEvent.setup();
    render(<MonsterImportPage />);
    await user.click(screen.getByRole("button", { name: /sync from open5e/i }));

    expect(
      await screen.findByText(
        /sync complete: 5 inserted, 2 skipped, 0 errors/i,
      ),
    ).toBeInTheDocument();
  });
});
