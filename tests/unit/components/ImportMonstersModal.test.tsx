import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockFetchResponse } from "@/tests/unit/helpers/mockFetchResponse";
import { ImportMonstersModal } from "@/app/monsters/ImportMonstersModal";

function jsonResponse(body: unknown, status = 200): Response {
  return new MockFetchResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }) as unknown as Response;
}

const VALID_MONSTER = {
  name: "Goblin",
  size: "small",
  type: "humanoid",
  ac: 15,
  maxHp: 7,
  speed: "30 ft.",
  challengeRating: 0.25,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8,
  },
};

let originalFetch: typeof global.fetch;
const onClose = jest.fn();
const onImported = jest.fn();

function textPolyfill(this: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(this as Blob);
  });
}

beforeEach(() => {
  originalFetch = global.fetch;
  Object.defineProperty(File.prototype, "text", { configurable: true, value: textPolyfill });
  Object.defineProperty(Blob.prototype, "text", { configurable: true, value: textPolyfill });
  (URL as unknown as { createObjectURL: jest.Mock }).createObjectURL = jest
    .fn()
    .mockReturnValue("blob:mock");
  (URL as unknown as { revokeObjectURL: jest.Mock }).revokeObjectURL = jest.fn();
  // jsdom logs "navigation not implemented" when an <a> is clicked — no-op it.
  jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

function renderModal(open = true) {
  return render(
    <ImportMonstersModal isOpen={open} onClose={onClose} onImported={onImported} />,
  );
}

function jsonFile(content: unknown, name = "monsters.json") {
  return new File([JSON.stringify(content)], name, { type: "application/json" });
}

async function selectFile(user: ReturnType<typeof userEvent.setup>, file: File) {
  await user.upload(screen.getByLabelText(/select json file/i), file);
}

describe("ImportMonstersModal — idle state", () => {
  it("renders the schema download link and a required-field table", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: /download the required json structure/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    // 'name' is required, 'description' is optional
    const rows = screen.getAllByRole("row");
    expect(rows.some((r) => /name/.test(r.textContent ?? "") && /required/.test(r.textContent ?? ""))).toBe(true);
  });

  it("download link produces a JSON blob whose top level is an array of one monster", async () => {
    const user = userEvent.setup();
    renderModal();
    const createObjectURL = (URL as unknown as { createObjectURL: jest.Mock })
      .createObjectURL;
    await user.click(
      screen.getByRole("button", { name: /download the required json structure/i }),
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const parsed = JSON.parse(await blob.text());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBeDefined();
  });
});

describe("ImportMonstersModal — client-side guards", () => {
  it("shows a parse error and issues no fetch for a non-JSON file", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn() as typeof fetch;
    renderModal();
    await selectFile(user, new File(["not json {{{"], "bad.json", { type: "application/json" }));
    expect(await screen.findByTestId("import-modal-error")).toHaveTextContent(/not valid json/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows a size error and issues no fetch for a file over 5 MB", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn() as typeof fetch;
    renderModal();
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.json", {
      type: "application/json",
    });
    await selectFile(user, big);
    expect(await screen.findByTestId("import-modal-error")).toHaveTextContent(/5 MB/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("ImportMonstersModal — validation + preview", () => {
  it("valid file calls /validate then renders the count and names", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ valid: true, count: 2, names: ["Goblin", "Orc"], isAdmin: false }),
    ) as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER, { ...VALID_MONSTER, name: "Orc" }]));

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("Goblin")).toBeInTheDocument();
    expect(screen.getByText("Orc")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/monsters/upload/validate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("validation 400 keeps the modal open with an announced error region", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse(
        { valid: false, errors: [{ field: "monsters[0].abilityScores", message: "Required" }], isAdmin: false },
        400,
      ),
    ) as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([{ name: "x" }]));

    const region = await screen.findByTestId("import-modal-error");
    expect(region).toHaveAttribute("role", "alert");
    expect(region).toHaveTextContent("monsters[0].abilityScores: Required");
    expect(screen.getByLabelText(/select json file/i)).toBeInTheDocument();
  });
});

describe("ImportMonstersModal — scope + confirm", () => {
  async function toPreview(user: ReturnType<typeof userEvent.setup>, isAdmin: boolean) {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin }),
    );
    global.fetch = fetchMock as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    return fetchMock;
  }

  it("non-admin sees no scope choice and confirm posts scope personal", async () => {
    const user = userEvent.setup();
    const fetchMock = await toPreview(user, false);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ inserted: ["Goblin"], skippedDuplicates: [], reverted: false }),
    );
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
    await screen.findByText(/imported/i);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.scope).toBe("personal");
  });

  it("admin sees a Personal/Global choice defaulting to Personal; Global posts scope global", async () => {
    const user = userEvent.setup();
    const fetchMock = await toPreview(user, true);
    const globalRadio = screen.getByRole("radio", { name: /global/i });
    expect(screen.getByRole("radio", { name: /personal/i })).toBeChecked();
    await user.click(globalRadio);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ inserted: ["Goblin"], skippedDuplicates: [], reverted: false }),
    );
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
    await screen.findByText(/imported/i);
    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.scope).toBe("global");
  });
});

describe("ImportMonstersModal — done + revert", () => {
  async function confirmWith(user: ReturnType<typeof userEvent.setup>, ingestBody: unknown, status = 200) {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }))
      .mockResolvedValueOnce(jsonResponse(ingestBody, status));
    global.fetch = fetchMock as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
  }

  it("renders skipped duplicate names on done", async () => {
    const user = userEvent.setup();
    await confirmWith(user, { inserted: [], skippedDuplicates: ["Goblin"], reverted: false });
    expect(await screen.findByText(/skipped 1 duplicate/i)).toHaveTextContent("Goblin");
  });

  it("reverted response shows rollback + manual-cleanup copy", async () => {
    const user = userEvent.setup();
    await confirmWith(
      user,
      { reverted: true, errors: [{ message: "boom" }] },
      500,
    );
    const region = await screen.findByTestId("import-modal-error");
    expect(region).toHaveTextContent(/rolled back/i);
    expect(region).toHaveTextContent(/manual cleanup/i);
  });
});

describe("ImportMonstersModal — network failures", () => {
  it("a rejected validate request shows a reach-the-server error and logs it", async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));

    expect(await screen.findByTestId("import-modal-error")).toHaveTextContent(
      /could not reach the server to validate/i,
    );
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("a non-JSON validate response shows an unexpected-response error", async () => {
    const user = userEvent.setup();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError("bad json")),
    }) as unknown as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));

    expect(await screen.findByTestId("import-modal-error")).toHaveTextContent(
      /unexpected response/i,
    );
    consoleError.mockRestore();
  });

  it("a rejected ingest request shows a reach-the-server error", async () => {
    const user = userEvent.setup();
    jest.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }))
      .mockRejectedValueOnce(new Error("network down"));
    global.fetch = fetchMock as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(await screen.findByTestId("import-modal-error")).toHaveTextContent(
      /could not reach the server to complete/i,
    );
  });

  it("a reverted response with orphaned ids surfaces the ids to the user", async () => {
    const user = userEvent.setup();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }))
      .mockResolvedValueOnce(
        jsonResponse({ reverted: true, errors: [{ message: "boom" }], orphanedMonsterIds: ["m1", "m2"] }, 500),
      );
    global.fetch = fetchMock as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    const region = await screen.findByTestId("import-modal-error");
    expect(region).toHaveTextContent("m1");
    expect(region).toHaveTextContent("m2");
  });
});

describe("ImportMonstersModal — onImported gating", () => {
  it("calls onImported after a close following an import that inserted monsters", async () => {
    const user = userEvent.setup();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }))
      .mockResolvedValueOnce(jsonResponse({ inserted: ["Goblin"], skippedDuplicates: [], reverted: false }));
    global.fetch = fetchMock as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
    await screen.findByText(/imported/i);

    onImported.mockClear();
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("does not call onImported after an all-duplicates result (nothing inserted)", async () => {
    const user = userEvent.setup();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }))
      .mockResolvedValueOnce(jsonResponse({ inserted: [], skippedDuplicates: ["Goblin"], reverted: false }));
    global.fetch = fetchMock as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
    await screen.findByText(/imported/i);

    onImported.mockClear();
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onImported).not.toHaveBeenCalled();
  });
});

describe("ImportMonstersModal — in-flight request protection", () => {
  it("ignores Escape while validation is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (r: Response) => void;
    global.fetch = jest.fn(
      () => new Promise<Response>((resolve) => { resolveFetch = resolve; }),
    ) as unknown as typeof fetch;
    renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText(/validating/i);

    onClose.mockClear();
    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();

    resolveFetch(jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }));
    await screen.findByText("1");
  });

  it("resets the file input after a failed selection so re-selecting the same file works", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn() as typeof fetch;
    renderModal();
    const input = screen.getByLabelText(/select json file/i) as HTMLInputElement;
    await selectFile(user, new File(["not json {{{"], "bad.json", { type: "application/json" }));
    await screen.findByTestId("import-modal-error");
    expect(input.value).toBe("");
  });
});

describe("ImportMonstersModal — closing", () => {
  it("Cancel closes and reopening shows the idle state with no file", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue(
      jsonResponse({ valid: true, count: 1, names: ["Goblin"], isAdmin: false }),
    ) as typeof fetch;
    const { rerender } = renderModal();
    await selectFile(user, jsonFile([VALID_MONSTER]));
    await screen.findByText("1");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalled();

    // The page remounts the modal on each open (key prop); mirror that here.
    rerender(<ImportMonstersModal key="a" isOpen={false} onClose={onClose} onImported={onImported} />);
    rerender(<ImportMonstersModal key="b" isOpen={true} onClose={onClose} onImported={onImported} />);
    expect(screen.getByLabelText(/select json file/i)).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("Escape closes the modal", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
