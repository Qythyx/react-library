# Session: Refusal reasons on a failed API response

- **Date**: 2026-09-03
- **Branch**: `worktree-issue-1`
- **Related sessions**: first session summary in this repo; implements
  [issue #1](https://github.com/Qythyx/react-library/issues/1), raised from beerbox #80.

## What was accomplished

- Added caller-defined refusal reasons to the API response types, so a consumer can react to one
  specific refusal ("out of stock" vs. an ETag conflict, both HTTP 412) instead of keying on the
  status code.
- Final shape in `src/utils/types.ts` — three types, down from the five the issue started with:

    ```ts
    export type ApiResponse<TData, TReason = never> = FailedResponse<TReason> | OkResponse<TData>;
    export interface FailedResponse<TReason = never> {
        error?: string;
        ok: false;
        reason?: TReason;
        status: number;
    }
    export interface OkResponse<TData> {
        data: TData;
        ok: true;
        status: number;
    }
    ```

- Threaded `TReason` through every generic declaration in `src/hooks/useApiAction.ts` and added
  `FailedHandler<TReason>`, so the reason survives to `failedHandler` — the only place a consumer of
  this library reacts to a failure.
- Added a `typecheck` script (`tsc --noEmit`) and wired it into `.github/workflows/publish.yml`.
  Nothing in CI previously type-checked the test files, so the type-level assertions this feature
  depends on were unenforced.
- Documented the feature: a README section plus JSDoc on the public types, which ships in the
  emitted `.d.ts` and surfaces in editor tooltips.
- Two cold subagent reviews (Fable), the second of which caught a decision that had inverted.

## Key decisions

- **`failedHandler` became generic over the reason** rather than staying on `BadResponse`. The
  fallback the issue proposed — narrowing with `'reason' in response` — yields `unknown` against a
  type that declares no such property, so callers would have to cast. That is the same unchecked
  guess as keying on an HTTP status, which is what the issue exists to remove.
- **The failure union went through four shapes** before settling. Two-armed (success, or a failure
  that always names a reason) cannot represent an infrastructure failure. Three-armed was honest but
  needed an `'reason' in response` narrowing trick. Making `reason` optional removed the trick.
  Finally `RejectableApiResponse` was renamed to `ApiResponse` — with `reason` optional there is no
  non-rejectable variant to distinguish it from, so the name described nothing.
- **`BadResponse` and `RejectedResponse` were deleted.** `BadResponse` is `FailedResponse<never>`;
  `RejectedResponse` promised a reason on every failure, and no such promise can honestly be made.
  Beerbox's own `ServiceGateway.processResponse` already works around this with
  `error?.Reason ?? ServiceRejectionReason.NotApplicable` — a sentinel invented to fill the gap.
- **`TReason = never` defaults were removed, then restored.** See Key learnings; the evidence for
  removing them stopped holding once `reason` became optional, and restoring them also removed 28
  `, never` annotations and left beerbox needing no edits at all.
- **Rejected: threading `TData`/`TReason` through `useApiAction` itself.** It compiles to two
  errors, and it fixes `TData` for the whole component — but a component calls `executeAction` for
  several endpoints with different payloads (`Users.tsx` in beerbox calls it four times). Recorded
  in the issue's Out of scope.
- **Rejected: hardening a test's `expect(...).toBe(...)` into a typed assignment.** The regression
  it would catch is already caught by the `never` arm four lines below, so it defended twice against
  one failure.

## Key learnings

- **`npm test` does not type-check.** `ts-jest` runs transpile-only here because `tsconfig.json`
  sets `isolatedModules: true`. Verified by putting `const n: number = 'not a number'` in a test
  file and watching jest pass. `npm run typecheck` is what enforces the type-level assertions, and
  CI ran neither until this change.
- **An optional `never` is `undefined`, and that inverts a hazard.** With `reason: TReason`
  required, `TReason = never` makes the arm uninhabited and `never` is assignable to everything, so
  checks pass vacuously — silent. With `reason?: TReason` optional, `TReason = never` makes the
  field `undefined`, which rejects string comparisons — loud. The argument for removing the defaults
  was correct for the first shape and false for the second, and was carried across the change
  without re-testing.
- **The inference hazard needs an inline arrow that takes the signal parameter.** Writing
  `failedHandler` before `action` only collapses `TReason` when the action is `signal => f(signal)`;
  `action: f` and `action: () => f()` both infer correctly. The contextually-typed parameter is what
  forces TypeScript to settle the type parameter early.
- **`expect()` accepts `any`, so a runtime assertion guards nothing about a type.** A degraded type
  leaves the runtime value untouched, so `expect(response.reason).toBe('out-of-stock')` stays green.
- **An object literal narrows its own variable**, so a test that builds a union value inline never
  exercises the `ok` check it appears to test.
- **Prettier formats embedded code in markdown fences for languages it parses** (ts/tsx/json) and
  leaves the rest verbatim (bash, csharp, txt). This is why beerbox's markdown never hit the
  hard-tab lint rule: it has no TypeScript fences.
- **A worktree and its primary checkout have separate config files.** Repeated "the fix didn't work"
  reports on `.prettierrc` traced to two copies — edits landed in the worktree while the editor read
  the main checkout's.

## Ideas and follow-ups

- `npm run clean` is `rm -rf dist tsconfig.tsbuildinfo` but `build:dist` writes
  `tsconfig.build.tsbuildinfo`, which it leaves behind — so `clean && build:dist` exits 0 and
  produces **no `dist` at all**. Pre-existing; doesn't affect CI, where the checkout is fresh. Worth
  its own issue.
- `useApiAction` pushes a generic status message into `setError` for every failure before calling
  `failedHandler`, so a caller rendering its own message for a specific reason also gets the generic
  banner. Out of scope here; recorded in the issue as a known gap.
- A `pretest` hook running `typecheck` would fail on the machine that made the mistake rather than
  in CI. Raised and deliberately declined this session — the CI step was judged sufficient.
- `README.md` does not satisfy the `.prettierrc` markdown override it now carries (four lines over
  100 columns), so the next editor save will reflow it.

## Commits

- `feat: carry a caller-defined refusal reason on a failed response`

## Files changed

**Types and hook**

- `src/utils/types.ts` — rewritten; three types, `reason?: TReason` optional
- `src/hooks/useApiAction.ts` — `TReason` threaded through all seven generic declarations, plus
  `FailedHandler<TReason>`; no statement in any function body changed
- `src/index.ts` — exports updated

**Tests**

- `src/utils/types.test.ts`, `src/hooks/useApiAction.test.ts` — reworked across four type-design
  revisions; new tests for the reason-less failure, the inferred reason type, and the
  handler-before-inline-action hazard

**Tooling and docs**

- `package.json`, `.github/workflows/publish.yml` — `typecheck` script and CI step
- `README.md` — "Refusal reasons" section
- `.prettierrc` — top-level options restored after they were replaced by a markdown-only override
  (unrelated to the feature)
