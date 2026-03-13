import {
  buildTestNamespace,
  createTestIdentity,
  scopedValue,
} from "../e2e/helpers/isolation";

describe("e2e isolation helpers", () => {
  it("builds a stable namespace from worker, retry, and title", () => {
    expect(
      buildTestNamespace({
        workerIndex: 2,
        retry: 1,
        title: "Combat flow: Dragon Attack!",
      }),
    ).toBe("w2-r1-combat-flow-dragon-attack");
  });

  it("scopes visible data labels without losing the base name", () => {
    expect(scopedValue("Aragorn", "w0-r0-register-flow")).toBe(
      "Aragorn [w0-r0-register-flow]",
    );
  });

  it("creates unique emails and scoped values for isolated test identities", () => {
    const identity = createTestIdentity({
      workerIndex: 0,
      retry: 0,
      title: "registered user can create a character",
    });

    expect(identity.namespace).toBe(
      "w0-r0-registered-user-can-create-a-character",
    );
    expect(identity.email).toMatch(
      /^w0-r0-registered-user-can-create-a-character-[a-f0-9]{32}@example\.com$/,
    );
    expect(identity.name("Fellowship")).toBe(
      "Fellowship [w0-r0-registered-user-can-create-a-character]",
    );
  });
});