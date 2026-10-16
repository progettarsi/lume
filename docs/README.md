# Lume landing — GitHub Pages

Source: user supplied lume-landing-page.zip. Original layout, logo, editorial content and palette retained. Design tokens checked against synapse-mobile/src/design-system/tokens.ts.

Live: https://progettarsi.github.io/lume/
Publishing source: gh-pages branch, /docs. App and main branch are unchanged.

## Release updates

The browser reads https://api.github.com/repos/progettarsi/lume/releases/latest (latest stable, published release). Version, APK name, direct download, release title and full release notes update together. Only uploaded APK assets from this repository are accepted. If multiple architecture-specific APKs exist without a universal APK, the CTA opens the release so the visitor can choose. No token is shipped. Notes are plain text, never interpreted as HTML.

Successful responses are cached in localStorage for 15 minutes; cache entries older than 7 days, malformed entries, future timestamps, drafts, prereleases and foreign URLs are discarded. Expired usable data is displayed while revalidating with a 7-second timeout. Offline, denied storage, malformed JSON, HTTP errors, missing APK and rate limits retain a working release-page fallback. Retry-After / X-RateLimit-Reset are respected (bounded to 24 hours). Tabs recheck after 15 minutes, when returning to the page, and on reconnection.

release-fallback.json and the HTML contain a deployment-time snapshot, explicitly labelled when live verification is unavailable. It is not presented as a newly checked latest release. JavaScript-disabled visitors get a link to /releases/latest. A new release needs no site edit or deployment; new visitors fetch it immediately, and cached visitors refresh within 15 minutes.

## Verify and publish changes

From repository root: node --test docs/tests/release.test.mjs. Push only the gh-pages branch. GitHub Pages publishes /docs automatically. Refresh the optional fallback snapshot when editing the site.

The phone is an illustrative HTML preview, not a native screenshot. Wikipedia demo text: https://it.wikipedia.org/wiki/Tregua_di_Natale (Wikipedia contributors, CC BY-SA 4.0). Newsreader is requested from Google Fonts with system fallbacks. No analytics or tracking SDK.
