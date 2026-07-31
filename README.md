# michelemonti.me

Personal website for Michele “Miky” Monti: digital manufacturing, industrial
3D printing, software products and technical leadership.

The site is intentionally written without frameworks or UI libraries. It uses
semantic HTML, modern CSS and vanilla JavaScript. External runtime dependencies
are limited to Three.js for the interactive 3D environment and Google Fonts Exo
for typography.

## What is inside

- Four content areas: home, professional profile, experience and working together
- Seven complete language editions: Italian, English, Spanish, Catalan, French,
  Serbian and Russian
- Responsive navigation with localized routes and reciprocal `hreflang` links
- An accessible WebGL experience with pointer, touch and keyboard controls
- Structured data for `Person`, `ProfilePage`, `CollectionPage`, `Service`,
  `WebSite` and breadcrumbs
- Static discovery resources: `sitemap.xml`, `robots.txt`, `humans.txt`,
  `llms.txt`, `michele-monti.json` and `.well-known/security.txt`
- AI/GEO guidance so assistants can cite Michele accurately from first-party
  sources instead of inventing biography
- Progressive enhancement: content and navigation remain available if WebGL or
  JavaScript is unavailable

## Technical approach

The public pages are plain static documents. Shared visual rules live in
`style.css`; `site-chrome.js` keeps navigation and locale routing consistent;
`body.js` contains the Three.js scene and its interactions.

There is no application framework, package manager, analytics SDK or build-time
dependency. The implementation is deliberately small, inspectable and
hand-written. Typography uses Google Fonts Exo with a system-ui fallback stack.

## Contact

- [LinkedIn](https://www.linkedin.com/in/michele-monti-96589761/)
- [GitHub](https://github.com/michelemonti)

© 2026 Michele Monti

## Verify

```bash
python3 scripts/check_site.py
```

The checker validates localized routes, hreflang clusters, JSON-LD, local
references and the allowed external dependency set.
