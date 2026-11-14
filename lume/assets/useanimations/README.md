# useAnimations (MIT)

Selected official vector animations downloaded from `https://useanimations.com/icons/{id}.json` on 2026-10-16: `home`, `user`, `bookmark`, `shuffle`. No web React wrapper is used; the existing native Lottie player handles the JSON locally.

Copyright and complete redistribution terms: [useAnimations MIT](../licenses/useAnimations-MIT.txt). Upstream license: https://github.com/useAnimations/react-useanimations/blob/master/LICENSE.

`scripts/generate-icon-rest-frames.cjs`, run with Node from the app root, derives both static endpoints for the selected shape-only assets into `src/design-system/animatedIconFrames.ts`. Runtime recoloring and the inclusion of the final frame happen on an in-memory copy. The downloaded JSON stays unchanged.

The selected Phosphor Regular/Fill paths in `src/design-system/phosphorPaths.ts` come from the official `@phosphor-icons/core` 2.1.1 package, https://registry.npmjs.org/@phosphor-icons/core/-/core-2.1.1.tgz. Complete terms: [Phosphor MIT](../licenses/Phosphor-MIT.txt). Only the selected paths are bundled, without a new runtime package.
