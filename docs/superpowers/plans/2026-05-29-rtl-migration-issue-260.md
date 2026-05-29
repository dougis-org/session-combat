# RTL Migration — AlignmentSelect, NavBar, CreatureStatBlock

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate three component test files from the manual `createRoot`/`act`/`container.querySelectorAll` pattern to React Testing Library (RTL), following the project's established RTL conventions.

**Architecture:** Each test file is migrated independently. The `@jest-environment jsdom` pragma and `IS_REACT_ACT_ENVIRONMENT` global are removed (RTL handles both). The `createReactRoot`/`unmountReactRoot` helper imports are dropped; RTL's `render` and automatic cleanup replace them. Queries shift from imperative DOM traversal to semantic `screen.*` queries.

**Tech Stack:** Jest 29, `@testing-library/react` v16, `@testing-library/user-event` v14, `@testing-library/jest-dom` (globally configured in `jest.setup.ts`)

---

## Reference: Established RTL Pattern

The project's established RTL style is visible in `tests/unit/CombatStatsRow.rtl.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { SomeComponent } from '@/lib/components/SomeComponent';

describe('SomeComponent', () => {
  test('renders something', () => {
    render(<SomeComponent prop="value" />);
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
});
```

Key conventions to follow:
- Keep `@jest-environment jsdom` pragma
- **Remove** `IS_REACT_ACT_ENVIRONMENT` global — RTL sets it automatically
- **Remove** `createReactRoot`/`unmountReactRoot` helper imports
- **Remove** `createRoot`, `Root`, `act` imports
- **Remove** `beforeEach`/`afterEach` lifecycle for mount/unmount — RTL cleans up automatically
- Use `screen.getBy*` for elements that must exist; `screen.queryBy*` for elements that may be absent
- Use `userEvent` (from `@testing-library/user-event`) for interactions, not `.click()` or `dispatchEvent`

---

## Task 1: Migrate AlignmentSelect.test.tsx

**Files:**
- Modify: `tests/unit/components/AlignmentSelect.test.tsx`

### Context

The component (`lib/components/AlignmentSelect.tsx`) renders:
- A `<label>` with text "Alignment" and `htmlFor` pointing to the select's `useId()` id
- A `<select>` with `aria-label="Alignment"`
- An initial `<option value="">Select Alignment</option>` placeholder
- One `<option>` per alignment in `VALID_ALIGNMENTS` (or first 9 by default)

The select has both a `<label>` and `aria-label="Alignment"`. `screen.getByLabelText('Alignment')` resolves via the `<label>` association (preferred), but `aria-label` is the fallback — either approach works.

### Query Mapping

| Old | RTL Replacement |
|-----|----------------|
| `container.querySelector('label')` | `screen.getByRole('generic')` → use `screen.getByText('Alignment')` |
| `container.querySelector('select')` | `screen.getByRole('combobox', { name: 'Alignment' })` |
| `container.querySelectorAll('option')` | `screen.getAllByRole('option')` |
| `select.value = X; dispatchEvent('change')` | `await userEvent.selectOptions(select, 'Chaotic Evil')` |
| `select.disabled` | `expect(combobox).toBeDisabled()` / `not.toBeDisabled()` |

- [ ] **Step 1: Replace the file with the migrated version**

Replace `tests/unit/components/AlignmentSelect.test.tsx` with:

```tsx
/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest } from '@jest/globals';
import { AlignmentSelect } from '@/lib/components/AlignmentSelect';
import { VALID_ALIGNMENTS } from '@/lib/types';

describe('AlignmentSelect', () => {
  test('renders a label with text "Alignment"', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} />);
    expect(screen.getByText('Alignment')).toBeInTheDocument();
  });

  test('renders a select with aria-label "Alignment"', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} />);
    expect(screen.getByRole('combobox', { name: 'Alignment' })).toBeInTheDocument();
  });

  test('renders exactly 10 options (1 placeholder + 9 standard alignments) by default', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} />);
    expect(screen.getAllByRole('option')).toHaveLength(10);
  });

  test('renders all VALID_ALIGNMENTS + placeholder when showExtendedAlignments is true', () => {
    render(
      <AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} showExtendedAlignments />,
    );
    expect(screen.getAllByRole('option')).toHaveLength(VALID_ALIGNMENTS.length + 1);
  });

  test('placeholder option has value "" and text "Select Alignment"', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} />);
    const placeholder = screen.getByRole('option', { name: 'Select Alignment' }) as HTMLOptionElement;
    expect(placeholder.value).toBe('');
  });

  test('each of the 9 standard alignment options has the correct value', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} />);
    const standardAlignments = VALID_ALIGNMENTS.slice(0, 9);
    standardAlignments.forEach((alignment) => {
      expect(screen.getByRole('option', { name: alignment })).toBeInTheDocument();
    });
  });

  test('controlled value: select shows the provided value as selected', () => {
    render(<AlignmentSelect value="Lawful Good" onChange={jest.fn() as (v: string) => void} />);
    const select = screen.getByRole('combobox', { name: 'Alignment' }) as HTMLSelectElement;
    expect(select.value).toBe('Lawful Good');
  });

  test('calls onChange with the selected value when user changes the select', async () => {
    const onChange = jest.fn() as jest.MockedFunction<(v: string) => void>;
    render(<AlignmentSelect value="" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Alignment' }), 'Chaotic Evil');
    expect(onChange).toHaveBeenCalledWith('Chaotic Evil');
  });

  test('select is disabled when disabled prop is true', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} disabled />);
    expect(screen.getByRole('combobox', { name: 'Alignment' })).toBeDisabled();
  });

  test('select is not disabled when disabled prop is false', () => {
    render(<AlignmentSelect value="" onChange={jest.fn() as (v: string) => void} disabled={false} />);
    expect(screen.getByRole('combobox', { name: 'Alignment' })).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the tests and verify all pass**

```bash
npx jest tests/unit/components/AlignmentSelect.test.tsx --no-coverage
```

Expected: 9 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/components/AlignmentSelect.test.tsx
git commit -m "test: migrate AlignmentSelect tests to RTL (#260)"
```

---

## Task 2: Migrate NavBar.test.tsx

**Files:**
- Modify: `tests/unit/components/NavBar.test.tsx`

### Context

The component (`lib/components/NavBar.tsx`) renders:
- Six `<Link>` (rendered as `<a>`) elements with link texts: "Campaigns", "Encounters", "Parties", "Characters", "Monsters", "Combat"
- A `<button data-testid="logout-button">Logout</button>` only when `isAuthenticated && !loading`

The existing test only checks 4 of the 6 nav links. The RTL migration improves this by checking by link text (semantic) rather than href attribute — but we also cover all 6 links since they're all present in the component.

The test file uses `jest.mock(...)` calls before imports — keep those exactly as-is since they mock `next/link` and `useAuth`.

### Query Mapping

| Old | RTL Replacement |
|-----|----------------|
| `container.querySelectorAll('a').map(a => a.getAttribute('href'))` | `screen.getByRole('link', { name: /text/i })` |
| `container.querySelector('[data-testid="logout-button"]')` | `screen.queryByTestId('logout-button')` (absent check) or `screen.getByTestId('logout-button')` (present check) |
| `element.click()` | `await userEvent.click(element)` |

- [ ] **Step 1: Replace the file with the migrated version**

Replace `tests/unit/components/NavBar.test.tsx` with:

```tsx
/**
 * @jest-environment jsdom
 */

import { jest, describe, it, expect } from '@jest/globals';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [k: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavBar } from '@/lib/components/NavBar';
import { useAuth } from '@/lib/hooks/useAuth';

const mockedUseAuth = jest.mocked(useAuth);

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    isAuthenticated: false, loading: false, logout: jest.fn() as any,
    user: null, login: jest.fn() as any, register: jest.fn() as any, error: null,
    ...overrides,
  });
}

describe('NavBar', () => {
  it('renders all navigation links', () => {
    mockAuth({});
    render(<NavBar />);
    expect(screen.getByRole('link', { name: 'Campaigns' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Encounters' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Parties' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Characters' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Monsters' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Combat' })).toBeInTheDocument();
  });

  it('does not show logout button when not authenticated', () => {
    mockAuth({});
    render(<NavBar />);
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('does not show logout button while loading', () => {
    mockAuth({ isAuthenticated: true, loading: true });
    render(<NavBar />);
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('shows logout button when authenticated and not loading', () => {
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' } });
    render(<NavBar />);
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('calls logout when logout button clicked', async () => {
    const logout = jest.fn() as any;
    mockAuth({ isAuthenticated: true, user: { userId: 'u1', email: 'u@test.com' }, logout });
    render(<NavBar />);
    await userEvent.click(screen.getByTestId('logout-button'));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests and verify all pass**

```bash
npx jest tests/unit/components/NavBar.test.tsx --no-coverage
```

Expected: 5 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/components/NavBar.test.tsx
git commit -m "test: migrate NavBar tests to RTL (#260)"
```

---

## Task 3: Migrate CreatureStatBlock.test.tsx

**Files:**
- Modify: `tests/unit/components/CreatureStatBlock.test.tsx`

### Context

The component (`lib/components/CreatureStatBlock.tsx`) renders:
- A `<CombatStatsRow>` that outputs "AC", the ac value, "HP", and `"${hp}/${maxHp}"` as text
- Ability score abbreviations (STR, DEX, etc.) in full mode; hidden in compact mode
- An `acNote` in parentheses when provided: `(chain mail)`

The existing RTL smoke test for `CombatStatsRow` (`tests/unit/CombatStatsRow.rtl.test.tsx`) uses `screen.getByText()` — follow that same pattern here.

### Query Mapping

| Old | RTL Replacement |
|-----|----------------|
| `container.textContent` contains `'AC'` | `screen.getByText('AC')` |
| `container.textContent` contains `'16'` | `screen.getByText('16')` |
| `container.textContent` contains `'30/30'` | `screen.getByText('30/30')` |
| `container.textContent` contains `'(chain mail)'` | `screen.getByText(/chain mail/)` |
| `container.textContent` not contains `'('` | `screen.queryByText(/\(/)` → `not.toBeInTheDocument()` |
| `container.textContent` contains `'STR'` | `screen.getByText('STR')` |
| `container.textContent` not contains `'STR'` | `screen.queryByText('STR')` → `not.toBeInTheDocument()` |

- [ ] **Step 1: Replace the file with the migrated version**

Replace `tests/unit/components/CreatureStatBlock.test.tsx` with:

```tsx
/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from '@jest/globals';
import { CreatureStatBlock } from '@/lib/components/CreatureStatBlock';

const BASE_ABILITY_SCORES = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
};

function renderBlock(props: Partial<Parameters<typeof CreatureStatBlock>[0]> = {}) {
  return render(
    <CreatureStatBlock
      abilityScores={BASE_ABILITY_SCORES}
      ac={16}
      hp={30}
      maxHp={30}
      {...props}
    />,
  );
}

describe('CreatureStatBlock — CombatStatsRow integration', () => {
  test('renders AC value under AC label', () => {
    renderBlock({ ac: 16 });
    expect(screen.getByText('AC')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  test('renders HP/maxHp values under HP label', () => {
    renderBlock({ hp: 30, maxHp: 30 });
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('30/30')).toBeInTheDocument();
  });

  test('renders acNote when provided', () => {
    renderBlock({ ac: 14, acNote: 'chain mail' });
    expect(screen.getByText(/chain mail/)).toBeInTheDocument();
  });

  test('renders without acNote when omitted', () => {
    renderBlock({ ac: 10 });
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  test('renders ability scores in full mode', () => {
    renderBlock({ isCompact: false });
    expect(screen.getByText('STR')).toBeInTheDocument();
    expect(screen.getByText('DEX')).toBeInTheDocument();
  });

  test('hides ability scores in compact mode', () => {
    renderBlock({ isCompact: true });
    expect(screen.queryByText('STR')).not.toBeInTheDocument();
    expect(screen.queryByText('DEX')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify all pass**

```bash
npx jest tests/unit/components/CreatureStatBlock.test.tsx --no-coverage
```

Expected: 6 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/components/CreatureStatBlock.test.tsx
git commit -m "test: migrate CreatureStatBlock tests to RTL (#260)"
```

---

## Task 4: Full Test Suite Verification + Issue Cleanup

**Files:** None — verification and GitHub issue update only

- [ ] **Step 1: Run the full unit test suite**

```bash
npm run test:unit
```

Expected: All suites pass, no regressions. The three migrated files should not appear in any failure output.

- [ ] **Step 2: Remove the `blocked` label from issue #260 on GitHub**

The blocker comment noted to remove the `blocked` label when #254 was merged. That's already done — confirm the label has been removed (it may already be gone) and that the issue is ready to close.

- [ ] **Step 3: Close issue #260**

After confirming the tests pass and the migration is complete, close GitHub issue #260 as completed.
