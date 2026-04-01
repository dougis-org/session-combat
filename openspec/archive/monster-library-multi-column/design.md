## Context

The `/monsters` page (`app/monsters/page.tsx`) renders two monster lists — user and global — each as a `div` with `space-y-4`, stacking cards vertically. The `MonsterTemplateEditor` form is rendered inline, above the list, when `editingTemplate` state is set.

Cards use `MonsterTemplateCard` which renders a `CreatureStatBlock` with `isCompact={true}` (shows only AC and HP). Card content is minimal and predictable in height, making it well-suited for a grid.

All state (`editingTemplate`, `editingMode`, `isAddingTemplate`) lives in `MonstersContent`. No state restructuring is needed — only render-tree changes.

## Goals / Non-Goals

**Goals:**
- Replace both `space-y-4` list containers with a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` layout
- Lift `MonsterTemplateEditor` out of the list and into a fixed full-screen modal overlay
- Modal closes on Escape key or backdrop click (both call `cancelEdit`)
- No regressions in edit/save/delete/copy behaviour

**Non-Goals:**
- Card content changes
- New components or files
- Any other page or route

## Decisions

### D1: Grid layout via Tailwind utility classes only

**Decision**: Use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` on the two list containers, replacing `space-y-4`.

**Rationale**: No new CSS, no new abstractions. The project already uses Tailwind throughout. Two-character change per list container.

**Alternative considered**: CSS columns (`columns-3`) — rejected because column layout reorders items top-to-bottom, which is disorienting for a library. Grid layout preserves row-major order.

### D2: Modal implemented as inline JSX in `MonstersContent`, no new component

**Decision**: Add a single conditional block in `MonstersContent`'s render output:

```jsx
{editingTemplate && (
  <div
    className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8"
    onClick={handleBackdropClick}
    onKeyDown={handleEscapeKey}  // attached to document via useEffect
  >
    <div className="max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
      <MonsterTemplateEditor ... />
    </div>
  </div>
)}
```

**Rationale**: The editor is only used in this one page. Extracting a `Modal` wrapper component adds indirection with no reuse benefit. Keeping it inline preserves the existing prop-passing pattern.

**Escape key**: Attach a `keydown` listener via `useEffect` when `editingTemplate` is set, remove it on cleanup. Calls `cancelEdit()`.

**Backdrop click**: The outer `div` onClick calls `cancelEdit()`. The inner `div` calls `e.stopPropagation()` to prevent bubble-through.

### D3: Editor removed from both section bodies

**Decision**: Remove both `{editingTemplate && editingMode === 'user' && <MonsterTemplateEditor ... />}` and the global equivalent from inside the section bodies. The single modal block at the top of `MonstersContent` render covers both modes since `editingMode` already distinguishes them.

**Rationale**: Consolidating to one modal instance reduces duplication and avoids two overlays rendering simultaneously.

## Proposal → Design Mapping

| Proposal Element | Design Decision |
|---|---|
| Grid layout (1/2/3 col) | D1: Tailwind grid classes on two containers |
| Max 3 columns | D1: `lg:grid-cols-3` |
| Editor as modal overlay | D2: Inline conditional fixed overlay in `MonstersContent` |
| Backdrop click to close | D2: `onClick` on outer div → `cancelEdit` |
| Escape key to close | D2: `useEffect` keydown listener |
| No card content changes | D1: `MonsterTemplateCard` untouched |

## Risks / Trade-offs

- **Modal scroll on short screens**: Long monster forms (many traits/actions) need to scroll within the modal. Mitigated by `overflow-y-auto` on the backdrop container and `py-8` padding so content isn't flush against edges.
- **z-index conflicts**: `z-50` should be sufficient for this app; no other known fixed/sticky elements at z-50 or above.
- **Backdrop click on mobile**: Touch events propagate the same way as click, so backdrop-close works on mobile without extra handling.

## Rollback / Mitigation

Pure CSS/JSX change with no API or data side effects. Rollback = revert the single file (`app/monsters/page.tsx`). CI failure policy: do not merge if any existing unit or integration tests fail.

## Open Questions

None. All decisions are resolved.
