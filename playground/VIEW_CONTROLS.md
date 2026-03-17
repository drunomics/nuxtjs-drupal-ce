# View Controls (Headless Pattern)

This playground note documents a **UI-agnostic** pattern for view filtering, sorting and pagination.

## Goal

Share logic in the module (query building, refresh, matching a target view block) while letting each downstream app choose its own UI.

## Recommended shared API

Create a composable in module/runtime such as `useDrupalCeViewControls()` that exposes:

- `rows`
- `pager`
- `filters`
- `sorts`
- `isLoading`
- `error`
- `noResults`
- `setFilter(key, value)`
- `setSort(key, value)`
- `setPage(page)`
- `reset()`
- `refresh()`

## Important matching rule

When a page contains multiple view blocks, always scope the refreshed result by:

- `viewId`
- `displayId`
- `parentUuid` (when present)

This prevents one block from reading another block's data.

## Query conventions

- Arrays should serialize as repeated `key[]` entries.
- Normalize sort order to `ASC` / `DESC` for Drupal Views compatibility.

## Runtime behavior

- Debounce UI-driven refreshes.
- Abort in-flight requests when a newer request starts.
- Treat missing view node after refresh as potential empty state (if backend omits block on no rows).

## Notes for downstream themes/apps

- Keep module composable headless.
- Implement UI in the app/theme layer (Nuxt UI, custom CSS, etc.).

See `playground/composables/useDrupalCeViewControls.example.ts` for a minimal shape.

## Lupus Decoupled Views compatibility

This pattern is intentionally aligned with:

- `lupus_decoupled/modules/lupus_decoupled_views`

Expected integration contract:

- exposed filters via URL query params
- exposed sorts (`sort_by`, `sort_order`)
- pager data (`current`, `totalPages`)
- optional no-results message (`noResults` or `no_results`)
- block scoping via `viewId`, `displayId`, `parentUuid`

Known constraints:

- payload details depend on Drupal/Lupus backend version and processor behavior
- multiple view blocks on one page must be scoped correctly (`viewId` + `displayId` + `parentUuid`)
- shared/overlapping exposed filter identifiers across blocks can conflict at query-string level
- backend memory/cache issues (e.g. APCu/PHP limits) must be solved in Drupal infrastructure
