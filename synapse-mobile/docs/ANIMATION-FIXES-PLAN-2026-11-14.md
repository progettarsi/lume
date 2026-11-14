# Animation fixes — resolution plan for Antigravity

14 November 2026. Base: branch `claude/awesome-wozniak-9m7qp1`, commit `de7c592` (Lume v0.2.5 plus haptics review fixes). Version stays 0.2.5/code 27: no release, APK, install or device run is part of this plan unless the user authorizes it separately.

The findings come from a code review, not from a device run. Reproduce each one before changing it. If the code shows that a finding is wrong, report it and skip it; don't work around it.

## Ground rules

- Read `synapse-mobile/AGENTS.md` first. In particular: gestures and animations stay interruptible, no timers that lock input, reduced motion is respected, text stays in its final layout (reveal via clipping, opacity and transforms only), and the approved row/dock/reader appearance does not change.
- Follow the project orchestration flow (`synapse-mobile/tools/agent-orchestration`). Only one agent edits the folder at a time. Antigravity's write scope is `src/components` (except the protected `Feed.tsx`), `tests` and `docs`.
- Section B lists items that are **outside** that scope (`App.tsx`, `src/design-system`, `Feed.tsx`). They are listed only so you know not to touch them.
- Don't commit, push, build or install unless the user says so.
- Some tests assert on source text (for example `tests/category-ui-visual.test.cjs`). If a change legitimately breaks one, update the assertion and explain why in the report.

## A. Items for Antigravity

Suggested order: A5 → A1 → A3 → A2 → A4 → A6. Each item is independent, and the first two touch the same flow (removing saved articles).

### A1. Rows jump during rapid consecutive removals

- **Where:** `src/components/ArticleList.tsx:14-19`.
- **Problem:** an exiting row stores the numeric `index` it had in the rendered `rows` when it was removed. When an earlier exiting row finishes and leaves `rows`, that stored index is one too large, so the still-exiting row is reinserted one slot lower in the middle of its exit.
- **Repro:** open Saved with at least 6 articles. Swipe-remove row 2, then row 5 within ~300 ms. When row 2's exit completes, row 5 jumps down one slot.
- **Change:** store a positional anchor instead of a number: the id of the row immediately before it in `rows` at removal time, or `null` for the top. On reinsertion, process exiting rows in removal order and insert each one after its anchor. The anchor can be a live row or an exiting row that is still present. If the anchor is gone, walk back to that row's own anchor, and fall back to the clamped index only as a last resort. Leave `restored`, `removing` and the layout transition unchanged.
- **Accept:** a harness test (vm + transpile, like `tests/design-system.test.cjs`) shows that after removing rows 2 and 5 and completing row 2's exit, the order of `data` keeps row 5 in its original visual slot. A single removal and undo behave as today.

### A2. The profile sheet hitches upward on swipe-to-dismiss

- **Where:** `src/components/ProfileEditorSheet.tsx:30-35` (`requestClose`) and `:54` (pan gesture).
- **Problem:** after a dismiss drag, `onFinalize` and `requestClose` both start a settle back toward `progress=1`. The close effect then animates to 0 with a fixed duration. The sheet moves up for a few frames before closing, and the fling velocity is ignored.
- **Change:** add a dismissal path for drags. When the session isn't dirty and isn't saving, continue from the current `progress` to 0 without settling to 1 first. Scale the duration by the remaining distance, and use the release velocity where it makes the close faster. Keep `ease`, and keep `motion.profile.sheetExit` as the upper bound. Settle back to 1 only when dismissal is refused: dirty (show the existing Alert) or saving. `onFinalize` must not override a dismissal already in progress; use a shared flag set in `onEnd`. The close button, backdrop, Annulla and the hardware Back path keep their current behaviour.
- **Accept:** releasing past the threshold never moves the sheet up. A dirty session returns to open and shows the Alert. With reduced motion, open and close are immediate. The sheet stays fully interruptible: grabbing it while it closes behaves as today.

### A3. The category rail's right fade pops in and out

- **Where:** `src/components/CategoryRail.tsx:40`, `:74-75`, `:81`, `:93`, `:114`.
- **Problem:** the right gradient is mounted and unmounted on the `atEnd` state, so it appears and disappears abruptly. The left gradient fades smoothly. AGENTS.md requires the two edges to mirror each other. The scroll handler also calls `runOnJS(updateOffset)` on every frame.
- **Change:** keep the rail width and content width in shared values (set from `onLayout` and `onContentSizeChange`). Always mount the right fade as an `Animated.View`. Set its opacity from the remaining distance, `content - (scrollX + width)`, mapped to 0…1 over 32 px with the same smoothstep the left fade uses. Hide it while either width is still unknown, so nothing flickers on mount. Keep the colours, the 32 px width and `pointerEvents="none"`. Remove `atEnd`, `offset` and `updateOffset`, and the per-frame `runOnJS`. Don't change the left fade or the chip behaviour.
- **Accept:** the right fade eases out over the last 32 px of scroll and back in on reversal. No JS call happens per scroll frame. A rail narrower than the screen shows no right fade. The existing category UI tests pass.

### A4. A theme switch can freeze on a screenshot

- **Where:** `src/components/ThemeReveal.tsx:11-17`.
- **Problem:** the theme is applied in `onReady`, which runs only on the image's `onLoad` (or `onError`). If neither fires, the frozen screenshot stays over the app at full opacity and the new theme is never applied. Touches pass through to UI the user can't see.
- **Change:** add one fallback. If the reveal hasn't started about 600 ms after mount, take the same path as `onError`: `onReady()` then `onDone()`, with no crossfade. Clear the timer on load, on error and on unmount. Keep the `started` guard so `onReady` can never run twice. The overlay is already `pointerEvents="none"`, so this timer doesn't lock input.
- **Accept:** a harness test where `onLoad` never fires calls `onReady` and `onDone` exactly once after the fallback. When the image loads in time, the crossfade is unchanged and the fallback never fires.

### A5. A swiped row can get stuck mid-removal

- **Where:** `src/components/SavedSwipe.tsx:18-27`.
- **Problem:** once a removal is committed, a touch that lands before the gesture is disabled runs `onBegin`, which calls `cancelAnimation(x)`. The exit timing then ends with `finished=false`, so `onExited` never runs. The row stays in ArticleList's `exiting` list and leaves a blank slot.
- **Change:** in `onBegin` (and `onUpdate`), do nothing while `committed.value` is true. Leave the rest of the exit and rollback logic, including the `removing` effect, as it is.
- **Accept:** extend the existing SavedSwipe harness in `tests/haptics.test.cjs`, or add a new test. Commit, call `onBegin` again, complete the exit timing, and check that `onExited` runs once and `x` was not cancelled after commit. The single-tick threshold haptic is unchanged.

### A6. A detached reader return stays opaque over the new page

- **Where:** `src/components/Reader.tsx:107` (`surface` opacity) and `:126` (`rowHandoff`).
- **Problem:** the return becomes detached when the user navigates away or the source list changes during a close. The surface keeps shrinking toward the old origin at full opacity, over the new page, and fades only during the last 12% of `progress`.
- **Behaviour to implement (already decided):** once a close is detached, fade the surface, the morphing title words and the row meta out over about 120 ms from the moment the detachment is seen. If the close starts already detached, start the fade at the start of the close. The geometry can keep animating. Use a shared value driven when `returnDetached && !open` becomes true. With reduced motion, set it to 0 immediately. An attached return must look exactly as it does now. Completion still comes from `returnFinished`, and the `pointerEvents` and accessibility rules on the root don't change.
- **Accept:** an attached close is pixel-identical to today. In a detached close, no opaque morph remains over the new page after about 120 ms. Reopening during a detached close is still impossible, because the root is already `pointerEvents="none"`.

## B. Main-agent items (do not touch)

These need `App.tsx`, `src/design-system` or the protected `Feed.tsx`, or they are visual or architectural decisions.

- **B1. Closing Saved, History, Settings or Search cuts instantly.** `ScreenLayer` (`src/design-system/components.tsx:56`) raises the newly active layer immediately. The page that is closing then slides out underneath an opaque page. The fix is to keep the outgoing layer raised until its spring completes (`App.tsx:241-283`, `:139-142`).
- **B2. Tapping a feed card while it is still settling.** The reader opens from the card's mid-flight position, closes back to that stale position, and the card then jumps (`Feed.tsx:54-56`, `:68`; `App.tsx:117-121`).
- **B3. Opening another article while the reader is closing.** The closing reader is replaced in a single frame (`App.tsx` `open`).
- **B4. Repeated identical toasts don't show again or restart their timer.** The cause is `key={toast}` (`App.tsx:288`).
- **B5. The title morph changes font size every frame** (`Reader.tsx:163-166`). This is a design decision; measure it on a device before changing anything.

## Verification

Run these in `synapse-mobile`:

1. `npm run typecheck`
2. `npm test` (currently 344/344 pass)
3. `npm run export` (Android/Hermes bundle)

Device checks only with explicit user authorization, on the persistent `Lume_API_36` emulator via `scripts/adb-emulator.ps1` (see `docs/ANDROID-EMULATOR.md`), never on a USB phone:

- A1/A5: Saved list, rapid double removal, undo, and a touch immediately after release.
- A2: drag the profile sheet down slowly, quickly, with a dirty name, and while saving.
- A3: scroll the rail to both ends and reverse mid-fade, in both themes.
- A4: switch theme several times in a row and while the app goes to the background.
- A6: open an article from Saved, start closing, tap Home in the dock during the close.
- All of the above again with system reduced motion on.

Keep static checks and device verification separate in the report. A passing test suite doesn't show that the motion looks right.

## Report back

For each item, give: done / skipped (with reason) / blocked, the files changed, the tests added or updated, and what was not verified. Also list anything that seemed to require touching a section B file; don't make that change.
