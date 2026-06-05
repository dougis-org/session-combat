import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Response as FetchResponse } from "node-fetch";
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
  return new FetchResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }) as unknown as Response;
}

let originalFetch: typeof global.fetch;

beforeEach(() => {
  originalFetch = global.fetch;
  // jsdom doesn't implement Blob.prototype.text() — polyfill with FileReader
  Object.defineProperty(File.prototype, "text", {
    configurable: true,
    value(this: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(this);
      });
    },
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

async function renderAndUpload(fileContent: unknown) {
  const user = userEvent.setup();
  render(<MonsterImportPage />);
  const file = new File([JSON.stringify(fileContent)], "monsters.json", {
    type: "application/json",
  });
  const input = screen.getByLabelText(/select json file/i);
  await user.upload(input, file);
  await user.click(screen.getByRole("button", { name: /^import monsters/i }));
  return { user };
}

const VALID_BODY = { monsters: [{ name: "A", maxHp: 5 }, { maxHp: 10 }] };

// ─── 207 partial-success handler ─────────────────────────────────────────────

describe("MonsterImportPage — 207 partial-success handler", () => {
  it("displays correct count, total, and formatted error details", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        {
          count: 1,
          total: 2,
          errors: [{ index: 1, message: "Missing name" }],
        },
        207
      )
    ) as typeof fetch;

    await renderAndUpload(VALID_BODY);

    const msg = await screen.findByText(/Successfully imported 1 of 2 monsters/i);
    expect(msg.textContent).toMatch(/\[index 1\]: Missing name/);
  });

  it("derives total from count + errors length when total is absent", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        { count: 1, errors: [{ index: 1, message: "Bad" }] },
        207
      )
    ) as typeof fetch;

    await renderAndUpload(VALID_BODY);

    // total absent → 1 (count) + 1 (errors.length) = 2
    expect(
      await screen.findByText(/Successfully imported 1 of 2 monsters/i)
    ).toBeInTheDocument();
  });

  it("shows 0 of 0 when result fields are absent (null-safe fallback)", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({}, 207)
    ) as typeof fetch;

    await renderAndUpload(VALID_BODY);

    expect(
      await screen.findByText(/Successfully imported 0 of 0 monsters/i)
    ).toBeInTheDocument();
  });

  it("shows fallback error string when errors is not an array", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ count: 0, total: 1, error: "Unexpected failure" }, 207)
    ) as typeof fetch;

    await renderAndUpload(VALID_BODY);

    const msg = await screen.findByText(/Successfully imported 0 of 1 monsters/i);
    expect(msg.textContent).toMatch(/Unexpected failure/);
  });

  it("handles string elements inside errors array", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        { count: 0, total: 1, errors: ["plain string error"] },
        207
      )
    ) as typeof fetch;

    await renderAndUpload(VALID_BODY);

    const msg = await screen.findByText(/Successfully imported 0 of 1 monsters/i);
    expect(msg.textContent).toMatch(/plain string error/);
  });
});
