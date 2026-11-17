# UX checklist

Permanent checklist from the UX polish pass (November 2026). Every new screen or change must keep these
rows green. Status: **Done** = built and covered by a test or the e2e flow; **Partial** = works, with the
gap noted; **Later** = belongs to a later roadmap phase (reason given).

Checks that apply to every screen:

| Area | Rule | Status |
| --- | --- | --- |
| Cards | Shared `Card`: 1 px `--card-border` (#0F1720, dark #3A4654), 20 px radius, layered `--shadow-card`, hover lift on pointer devices, 0.98 press, staggered enter | Done |
| Glass | Header, bottom nav, sheets, modals, toasts, dropdown menus use `.glass` (blur 18 px, solid fallback) | Done |
| Motion | 150–250 ms: page enter, sheets, button press, card stagger, count-up, rings and bars, toasts, list items; all off under reduced motion | Done |
| Motion | Enter animations use `backwards` fill so no transform lingers (otherwise dropdowns and sheets get trapped under later cards) | Done |
| Layering | Sheets render in a portal on `<body>` so they always sit above the nav and the coach button | Done |
| Haptics | Light haptic on button press, stepper and swipe on native; no-op on web | Done |
| Strings | No hard-coded text; `src/locales/keys.test.ts` fails if a used key is missing from English | Done |
| Languages | New strings translated into hi, te, ta, ar, es, pt, fr, de, id | Done |
| Languages | Older Phase 1 strings: hi/te/ta/ar ~300 and es/pt/fr/de/id ~430 keys still fall back to English (files are marked "core coverage, needs native review") | Partial |
| RTL | Arabic mirrors layout; amounts with units are direction-isolated ("1,050 ml"); swipe direction follows RTL | Done |
| Clipping | Checked at 390 px and 1280 px in en, te, hi, ta, ar; tile titles wrap instead of truncating | Done |
| Validation | Primary buttons disabled until valid; errors under the field; empty `error` never renders an empty alert | Done |
| States | Skeleton while loading, empty state with a next step, error toast with retry, offline banner | Done |
| Units | Inputs show the user's unit, store metric; typed text is never rewritten mid-typing; switching unit re-renders the converted value | Done |

## Screens

| Screen | Item | Status |
| --- | --- | --- |
| Onboarding | Date of birth as Day / Month (localised names) / Year (newest first); native wheel on mobile, type-to-jump on web; days follow month and leap years; live age; no future dates; minimum age 13; stored as ISO | Done |
| Onboarding | Height before weight; value left, unit dropdown right; cm or ft + in; kg, lb or st + lb; slider alternative; country defaults (US ft/in + lb, UK ft/in + st, others cm + kg) | Done |
| Onboarding | Goals: multi-select of 9, "Recommended for you" with one-line reason (BMI and activity), main goal drives calories, conflicting weight goals blocked with a message | Done |
| Onboarding | Allergies and restrictions: suggestion chips, searchable longer list, free typing (Enter or Add), removable chips | Done |
| Onboarding | Country searchable with flags, detected default; state or region from ISO 3166-2 data (lazy-loaded); optional city; changing country resets state and updates currency and units | Done |
| Onboarding | "City (optional)" label showed "(optional)" twice | Fixed |
| Home | Upgrade button in the header for Free and Premium; Pro badges open Plans; count-up numbers; ring and bars animate | Done |
| Home | "Streaks and badges" tile title was cut off at 390 px | Fixed |
| Plans | Free / Premium / Pro comparison from PRD §2; local currency (₹199/₹399, $9/$29, £9/£29, €9/€29); monthly prices; current plan highlighted; choosing saves `planInterest/{uid}` and says payments are launching soon | Done |
| Plans | Free card showed "Free" twice; now shows the local zero price | Fixed |
| Plans | Yearly toggle | Later (PRD §2 lists monthly prices only; add when yearly prices are decided) |
| Food | Quantity stepper, unit dropdown (food's own units first, then g, ml, serving, piece, katori, cup, tbsp, tsp, slice), 0.5× / 1× / 1.5× / 2× chips, live nutrition | Done |
| Food | Allergen warning icon in search results and a warning on the quantity screen | Done |
| Food | Edit entry: food (replace), quantity, unit, meal slot, time; delete with undo; swipe on touch, ⋯ menu everywhere | Done |
| Food | Entry line read "80 × g"; now "80 g", and "1 cup" instead of "1 × 1 cup" | Fixed |
| Food | Saved meals: rename and delete with undo | Done |
| Food | Recipes: delete with undo (swipe or ⋯ menu) | Fixed |
| Food | Recipes: edit an existing recipe's ingredients | Partial (follow-up; delete and re-create meanwhile) |
| Water | Large −/+ around the total; presets 100 ml, glass 250, bottle 500, 750 ml, 1 L; custom amount with ml, L, fl oz, cups (default by country); ring animates | Done |
| Water | Edit and delete each entry with undo; change daily target with suggested value | Done |
| Water | Custom amount input collapsed next to the unit dropdown (shared field style had conflicting widths) | Fixed |
| Weight | Log in the user's unit; date picker; optional waist / chest / hip with range check; edit and delete with undo | Done |
| Weight | Measurement steppers overflowed at 390 px; replaced with plain number fields | Fixed |
| Weight | Trend chart was blank with a single entry; latest value now shows as a dot | Fixed |
| Sleep | Morning date, bed and wake time pickers, quality chips; edit and delete with undo | Done |
| Steps | Manual steps with stepper and date; edit and delete with undo; device sync on native | Done |
| Workouts | History: edit name, duration (stepper), date; calories rescale; delete with undo | Done |
| Workouts | Editing individual sets of a finished workout | Partial (follow-up; the session screen edits sets before finishing) |
| Workouts | AI workout generator shows a Pro badge that opens Plans | Done |
| Planner | Pro badge and "See plans"; activities and habits editing | Later (Phase 4: planner is Pro) |
| Health | Tabs, panels and progress use the user's units | Done |
| Store | "Coming soon" with join / leave the list | Done |
| Coach | Locked state with "See plans"; Pro users chat with Jai or Jaya | Done |
| Coach | Gemini overload (503) or rate limit (429) retried with backoff, then a lighter fallback model | Done |
| Settings | Upgrade button; height / weight / volume unit dropdowns; country with flags (resets state, updates currency and units) | Done |
| Settings | Edit profile sheet: date of birth, sex, height, weight, goals, target weight, activity, diet, allergies, restrictions, state, city; save shows the new calorie target | Done |
| Settings | Delete account also removes `planInterest`; data export includes store waitlist and plan interest | Fixed |
| All lists | Swipe-row action panel leaked a red strip at the row edge; actions now render only while swiping or open | Fixed |

## Tests that guard this list

- Unit: `src/domain/__tests__/ux-domain.test.ts` (conversions, date validation, age, goal recommendation, allergen matching, quantity and unit nutrition, RTL unit formatting).
- Component: `src/components/ui/__tests__/controls.test.tsx` (stepper, combobox, chip input, row menu), `src/features/common/__tests__/fields.test.tsx` (date of birth, height and weight units, quantity editor).
- Strings: `src/locales/locales.test.ts`, `src/locales/keys.test.ts`.
- Functions: `functions/test/provider.test.ts` (retry and fallback).
- End to end: `e2e/flow.cjs` (emulators; also writes the 390 / 1280, light / dark sweep to `docs/screenshots/sweep/`) and `e2e/live-flow.cjs` (live on fit-me1).
