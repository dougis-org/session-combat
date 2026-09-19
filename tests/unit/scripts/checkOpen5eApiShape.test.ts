/**
 * @jest-environment node
 */
import { checkOpen5eApiShape } from "@/lib/scripts/checkOpen5eApiShape";
import { Open5EClient } from "@/lib/import/open5eAdapter";
import {
  createPaginatedResponse,
  SAMPLE_CREATURE,
  SAMPLE_SPELL,
} from "@/tests/helpers/open5eTestHelpers";

jest.mock("@/lib/import/open5eAdapter", () => {
  const actual = jest.requireActual("@/lib/import/open5eAdapter");
  return {
    ...actual,
    Open5EClient: jest.fn(),
  };
});

const MockedOpen5EClient = Open5EClient as jest.MockedClass<typeof Open5EClient>;

function mockClientWith(creature: typeof SAMPLE_CREATURE, spell: typeof SAMPLE_SPELL) {
  MockedOpen5EClient.mockImplementation(
    () =>
      ({
        fetchMonsters: jest.fn().mockResolvedValue(createPaginatedResponse([creature])),
        fetchSpells: jest.fn().mockResolvedValue(createPaginatedResponse([spell])),
      }) as unknown as InstanceType<typeof Open5EClient>
  );
}

describe("checkOpen5eApiShape", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes when creatures and spells match the expected shape", async () => {
    mockClientWith(SAMPLE_CREATURE, SAMPLE_SPELL);

    await expect(checkOpen5eApiShape()).resolves.toBeUndefined();
  });

  it("throws when a creature is missing its key", async () => {
    const badCreature = { ...SAMPLE_CREATURE, key: undefined } as unknown as typeof SAMPLE_CREATURE;
    mockClientWith(badCreature, SAMPLE_SPELL);

    await expect(checkOpen5eApiShape()).rejects.toThrow(/creature.key must be a string/);
  });

  it("throws when a spell's concentration field is not a boolean", async () => {
    const badSpell = { ...SAMPLE_SPELL, concentration: "false" } as unknown as typeof SAMPLE_SPELL;
    mockClientWith(SAMPLE_CREATURE, badSpell);

    await expect(checkOpen5eApiShape()).rejects.toThrow(/spell.concentration must be a boolean/);
  });

  it("throws when the creatures response has no results", async () => {
    MockedOpen5EClient.mockImplementation(
      () =>
        ({
          fetchMonsters: jest.fn().mockResolvedValue(createPaginatedResponse([])),
          fetchSpells: jest.fn().mockResolvedValue(createPaginatedResponse([SAMPLE_SPELL])),
        }) as unknown as InstanceType<typeof Open5EClient>
    );

    await expect(checkOpen5eApiShape()).rejects.toThrow(/creatures response had no results/);
  });
});
