# Mobile Prototype Agent Guide

## Prototype Instructions

In ChatGPT Work Mode, run `sites-preview start "$PWD"`, open `http://terminal.local:4173/` in the cloud browser, and verify the rendered app and its primary interactions. Keep that preview open and tell the user to inspect it in the cloud browser; do not present the local URL as a user-facing chat link. In Codex Desktop, run the local server yourself, open the preview in the in-app browser, and provide the clickable local URL. Do not deploy to Sites unless the user explicitly asks to share, publish, or deploy. Do not give the user server-start instructions when you can run it.

Before planning or implementing any mobile-app change, read this `AGENTS.md` in full. It is the source of truth for the template's runtime and component guidance.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Editing Boundary

- Build app-specific UI in `src/Prototype.tsx` and `src/prototype.css`.
- Treat `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `src/mobile/`, `public/assets/iphone/`, `public/assets/android/`, `public/assets/status/`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` as protected runtime files. Do not edit, replace, remove, or recreate them unless the user explicitly asks to change the mobile runtime itself. For an explicit runtime change, update the affected lock hashes only after verifying the new runtime behavior.
- Run `npm run check:runtime` before preview or handoff. If it fails, restore the protected runtime instead of weakening or bypassing the check.
- `npm run build` preserves the mobile runtime and prepares the static Cloudflare Worker output required by Sites. Before a Sites handoff, confirm `dist/client/index.html`, `dist/server/index.js`, `dist/.openai/hosting.json`, and source `.openai/hosting.json` exist, then run `npm run test:sites`. Do not replace this project with a Vinext starter.

## Runtime Contract

- Preserve the mobile device runtime unless the user's task explicitly asks otherwise. Do not replace it with a standalone page. Visual fidelity applies to app-owned content inside the device screen, not to template-owned device chrome.
- Keep `App` composed around `PhoneFrame` -> `KeyboardProvider`, with `StatusBar`, app content, `HomeIndicator`, and `KeyboardDock` mounted inside the phone frame. `StatusBar` and the iOS home indicator are overlaid device chrome. When the Android keyboard is closed, the app viewport reserves the protected navigation-bar region instead of painting behind it. When the Android keyboard is open, preserve the current full-screen keyboard layout: its asset includes the IME navigation strip and the separate black navigation bar is hidden. iOS screens continue to paint behind the home-indicator area and own their safe-area content padding.
- Preserve the `iPhone` / `Pixel 10` device picker and both calibrated device presets. The Pixel screen is `427 x 952`; its `32 x 32` camera circle and `public/assets/android/navigation-bar.svg` bottom navigation bar are protected device chrome, not app content.
- Preserve the device picker's intentionally lightweight Codex styling in the top-right corner: its trigger wrapper is borderless and transparent, its trigger sizes to content, and its right-aligned menu uses the compact 3px inset plus the specified hairline and elevation shadow layers. Keep the prototype root and default app screen white.
- Preserve `StatusBar` as live device chrome, including its platform-specific typography, source status-icon assets, and spacing. Pixel 10 uses Roboto, Android indicators, and 32px top, left, and right padding. iPhone uses its iOS indicators, system typography, and calibrated spacing. Do not hardcode screenshot times like `9:41` into the status bar, replace its real-time clock, or move status bar content into app markup unless the user explicitly asks for a fixed/mock device time.
- `PhoneFrame` owns the calibrated device frame, screen portal, device picker, camera cutout, and custom cursor. Keep device assets in `public/assets/iphone/` and `public/assets/android/`; if an asset fails to load, repair the asset path or restore the asset instead of removing the frame, keyboard, or image render.
- Use `MobileScroll` directly for simple single-screen prototypes. Use `FlowStack` for conventional multi-screen flows whose routes can own their fixed header and footer; when using it, define each route as a `FlowScreen`: `{ id, header?, headerHeight?, footer?, footerHeight?, render }`, and use `flow.push(screen)`, `flow.pop()`, and `flow.replace(screen)` from `FlowStack` render callbacks or `useFlow()` instead of introducing another router.
- Use `Carousel` for a carousel, horizontal rail, swipeable cards, image or media strip, horizontally scrollable cards, chip rail, or other horizontal collection.
- For a layered app shell—such as a persistent composer, independently presented sheet, pushed/peek sidebar, or app-wide transition—compose directly in `Prototype.tsx` rather than forcing it through `FlowStack`. Keep app-owned fixed chrome as sibling layers outside `MobileScroll`.
- When using `FlowScreen`, put route-owned fixed headers or footers in `FlowScreen.header` or `FlowScreen.footer`. Set `headerHeight` to the visible app-toolbar height; `FlowStack` adds the device's top safe-area/status-bar inset automatically. Do not include `StatusBar` or its height in the header. Set `footerHeight` to the full app-footer height. `FlowScreen.footer` is an overlay, not reserved layout space; screens using it must add their own bottom content padding such as `padding-bottom: calc(var(--flow-footer-height) + var(--mobile-safe-area-height) + 24px)` so final content can scroll above the footer while still painting behind it.
- Render only scrollable content inside `MobileScroll`; it is for content that should move with scroll and rubber-band overscroll. Keep app-owned headers, nav bars, tabs, composers, and overlays outside it. This keeps scroll physics, safe areas, keyboard insets, scrollbars, and drag click suppression active without letting content paint under fixed chrome.
- Buttons, links, cards, and images inside `MobileScroll` should still allow drag scrolling when the pointer moves beyond tap slop. Use `data-scroll-drag="ignore"` only for rare controls that must own the drag gesture themselves.
- Do not add `var(--keyboard-height)` to ordinary screen/content padding inside `MobileScroll`; the scroll viewport already shrinks above the simulated keyboard. For custom fixed composers, search bars, or toast chrome, use `useKeyboardInsets().bottomInset`. It is relative to the app viewport: Android returns `0` while the closed-keyboard viewport already reserves navigation, then returns the keyboard height while open; iOS continues to clear the home indicator while closed and ride directly above the keyboard while open. Do not pin custom bottom chrome to `bottom: 0` or only `keyboardHeight`.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for every text-entry control. A raw `input` or `textarea` disconnects focus, keyboard animation, safe-area insets, and attached surfaces.
- Use `BottomSheet` for phone-scoped sheets. Its props are `open`, `onOpenChange`, `title`, optional `description`, optional `snap`, and `children`; it renders through the phone screen portal and dismisses the keyboard before opening.

## Horizontal Carousels

- Use `Carousel` for horizontally draggable cards, images, media, chips, or other horizontal collections. Do not recreate these with `overflow-x`, custom pointer handlers, or a generic div.
- `Carousel` can be nested directly inside `MobileScroll`. It owns horizontal gestures and automatically yields vertical gestures to the parent.
- Never put `data-scroll-drag="ignore"` on or around a `Carousel`; doing so prevents vertical parent scrolling when a gesture begins inside it.
- Do not add CSS scroll snapping to `Carousel`; its runtime owns momentum and release motion.
- Use `data-scroll-drag="ignore"` only when a control must prevent parent scrolling in every drag direction.

See `src/mobile/COMPONENTS.md` for the full component and gesture contract.

## Keyboard Rule

The simulated keyboard is a separate top-layer component. Before presenting anything that behaves like iOS navigation or modal UI, dismiss it first.

Call `keyboard.hide()` before:

- pushing, popping, or replacing FlowStack routes
- opening bottom sheets, action sheets, dialogs, menus, or navigation sheets
- starting transitions where the destination should not inherit text-input focus

`FlowStack` already hides the keyboard for `push`, `pop`, and `replace`. `BottomSheet` already hides it before opening. If you add new modal/sheet/navigation primitives, follow the same rule.

When a composer, search surface, or other keyboard-attached component closes, call `keyboard.hide()` in the same event before changing that component's open state. Position attached surfaces from `useKeyboardInsets()` rather than a separate timer or visibility flag so both dismiss together.

When any text-entry control loses focus, dismiss the simulated keyboard. If the control is custom or does not use the runtime's keyboard-aware fields, handle its blur event and call `keyboard.hide()` explicitly. Keep the keyboard open only when focus is moving directly to another text-entry control that should share the same keyboard session.

## Interaction Rules

- Do not trigger buttons or inputs after a pointer has become a drag. Preserve the drag suppression behavior in `MobileScroll`.
- Do not allow native browser image/file dragging inside the phone frame. Preserve the phone-level `dragstart` suppression and non-draggable image styles so scroll drags that begin on images still scroll the prototype.
- Use `KeyboardInput`, `KeyboardTextarea`, or `MobileTextField` for text entry so the simulated keyboard and safe-area insets stay connected.
- Fixed phone chrome should not animate with pushed screens. Screen content can animate; the status bar, camera cutout, and preview chrome should stay put.
- Keep the keyboard below the home indicator/safe area layer in z-index, and above ordinary app UI while visible.
- Keep the home indicator as the topmost safe-area layer in the z-index above everything else in the prototype.

## Synapse product decisions
- Personal Android reading app, no account; currently a browser-based interactive prototype, not an installable APK.
- Selected visual target: selected-design.png, first displayed option from the final three footer alternatives.
- Warm ivory, ink and terracotta; Newsreader serif titles and Source Sans 3 paragraphs; Material Symbols Rounded icons.
- Category filters at top. Save aligns on the metadata row at right. No subtitle, instructional captions or next-article button.
- A centered floating dock: Home and Profilo share a capsule, Cerca is visually detached on its right. Profile contains Saved, History and Settings.
- Vertical swipes page the short feed. Tapping article opens a separate scrolling reader. Return preserves feed position.
- Search entry belongs near the thumb and rises above the runtime keyboard.
- Six bundled example readings. Saved IDs, reading history and preferences persist locally in this browser.
- Preserve protected mobile runtime; app UI lives in Prototype.tsx/prototype.css. Android Pixel is the default selected by app code.

## Motion and refinement decisions (7 October)
- Article tap compresses and rebounds before expanding from its own position; title and illustration travel into the reader. Extra paragraphs appear progressively, locally (no AI request).
- Routes crossfade with a small movement; nav and category indicators move between positions. Search result removal fades while remaining rows reorder with layout springs.
- Search opens with field focused and keyboard visible. Keep a reachable close-search control above the keyboard.
- Home uses 20 px default text and more content down to the dock, with a gradual bottom fade to suggest continuation. Swipes remain article paging; tap opens the full reader.
- Dark illustrations have feathered edges and blend into the paper in both themes. Theme colors transition together.
- Remove profile emblem, explanatory subtitles, device-local note and settings brand footer. Align page headings and row gutters consistently at 24 px.
- Respect reduced-motion preferences; all streaming text is immediately visible in that mode.

## Continuous motion refinement (7 October)
- Category chips select independently as buttons; no sliding category indicator. Hide when advancing the feed and reveal on reverse gesture or first article.
- Home contains only short paragraphs. Reader keeps the title opaque and lifts title, artwork and summary together as the press rebounds. Deep paragraphs stream during ascent.
- Reader remains mounted through closing; tapping its content reverses from the current motion values and retains revealed text. Reader from history/search opens immediately.
- Feed follows pointer displacement and settles with a spring; new gestures interrupt settlement. No paging cooldown or interaction lock.
- Save width uses spring layout animation. Theme interpolates from current palette; foreground polarity follows measured paper luminance.
- Preserve reduced-motion support and protected runtime. Feed proposal remains open to user feedback after trying the prototype.
- Reader closing from lists must visibly fade and retreat; do not leave an opaque clipped panel until unmount. Home return measures the source without its tap transform, refreshes the bounds on close, ends at scale 1, and restores the feed's bottom fade. Keep closing reversible.

## Text-only refinement (7 October)
- Remove all article illustrations and the illustrations setting. Home previews now include a third paragraph previously in the extended reading; full content is preserved without duplicating paragraphs.
- Home/Profile change uses a brief opacity-only crossfade; no route translation or zoom. Keep the sliding nav indicator.
- Save is a fixed 48 px icon-only button with accessible save/remove labels. Only color and outlined/filled icon opacity change; no scale, rotation or width animation.
- Exiting article rows are inert, disabled and cannot intercept taps. Row taps retain pointer capture and input focus until the click is processed; parent MobileScroll can take capture on drag. Suppress row clicks after pointer movement even when the list has no overflow.

## Spatial motion refinement (latest, 7 October)
- Supersedes earlier crossfade decisions: routes use a coupled full-width spring translation, horizontal for Home/Profile/collections and vertical for Search. No route opacity animation; rapid reversal retargets the existing stages.
- Reader from lists expands/contracts from measured row bounds. Its opaque title morphs font size, weight and position back to the original row; toolbar/body retract via clipping. Refresh source bounds on close, retain scroll offset and reversible progress.
- Save remains a fixed 48 px touch target. Icon compresses briefly then springs to normal geometry in about 250 ms; filled layer reveals by clipping. Rapid taps stop and retarget pulse/fill.
- Result rows, chips, dock, toast and streaming words use movement/clipping/scale rather than opacity fades. Palette interpolation and Home continuation gradient remain intentional.

## Reader and category polish (7 October)
- Preserve the approved Home reader motion. List-origin readers instead animate measured title words along coordinated paths, without changing line wrapping in mid-motion. Destination typography is measured independently; each word returns to its source position. Source row is visually covered while the reader is mounted, with metadata and arrow restored inside the shrinking surface. Body retracts before the row is reached.
- Chips keep independent button selection. Their fill expands inside the selected chip, with a press spring; individual chips tuck upward during feed paging and return on reverse gesture.
- Category content travels horizontally according to chip order. Each outgoing stage freezes its feed position so resetting the new category does not jump the previous article. Motion remains reversible and respects reduced motion.

## Save gesture and shuffle (7 October)
- Home article body supports double tap to save (idempotent: never unsaves). Single pointer tap waits 280 ms to distinguish it; keyboard activation opens immediately. Cancel pending opens on navigation, category/index changes, drags, wheel input and pointer-down on other controls. Double tap has a short bookmark confirmation.
- Search has a detached 56 px Shuffle button to the right of the composer, attached to keyboard insets. Random selection uses the whole bundled catalog and excludes the preceding random article within the session. Reader expands from/returns to this button; search query is preserved and focus restored on close.

## Shuffle return polish (7 October)
- Shuffle reader returns as a uniformly shrinking page into its measured button, rather than moving full-size type into a small clip. Content, surface rounding, accent color and icon reveal share reversible progress; Home/list readers preserve their existing geometry. Respect reduced motion.
