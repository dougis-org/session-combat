---
name: session-combat-design
description: Use this skill to generate well-branded interfaces and assets for Session Combat — a D&D 5e combat tracker and encounter manager — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `preview/`, `ui_kits/session-combat/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. The UI kit in `ui_kits/session-combat/` is React + inline JSX with no build step — copy `primitives.jsx`, `screens.jsx`, and `MonsterScreen.jsx` and reference them via `<script type="text/babel" src="…">`. The kit is the fastest path to a high-fidelity mock.

If working on production code, copy assets and read the rules in `README.md` to become an expert in designing with this brand. The live app is Next.js + Tailwind v4 with no custom theme — every token in `colors_and_type.css` maps to a stock Tailwind utility, so you can stay in Tailwind and stay correct.

Key rules to internalize before you start:

- **Dark-first, flat.** No gradients in the UI, no background imagery, no shadow on cards. Depth comes from surface contrast (`gray-900 → 800 → 700`).
- **Semantic role color.** Blue = party / primary. Red = enemy / destructive. Purple = lair / library. Green = save / go. Yellow = initiative / active turn. Never break the mapping.
- **No icons, no emoji.** Words on buttons. The only iconographic asset is the logo. One Heroicon inline-SVG is allowed as precedent (info circle). That's it.
- **Voice = DM's clipboard.** Imperative, terse, present-tense, second-person. Use D&D 5e jargon without explaining it (Initiative, HP, AC, DEX, CR, lair, legendary). No exclamation marks. No marketing language ("epic", "embark", "adventure"). No emoji.
- **Type family: IBM Plex.** Plex Sans for all UI, Plex Mono for dice/HP/init values, Plex Serif reserved for lore moments. Loaded via Google Fonts in `colors_and_type.css`.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, surface — slide / mock / production code / marketing page — fidelity, whether they want options), and then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
