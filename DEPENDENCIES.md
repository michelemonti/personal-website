# External Dependencies Recap

This static website has minimal external dependencies to keep it lightweight and simple.

## Libraries
- **Three.js** (v0.154.0): Loaded from CDN for 3D graphics and interactions.
  - Source: https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.min.js
  - Used for: Icosahedron mesh, wireframe, particles, lighting, camera controls, and rendering.

## Fonts
- **Google Fonts (Exo)**: Loaded via CSS link for typography.
  - Source: https://fonts.googleapis.com/css2?family=Exo:wght@400;600;800&display=swap

## No Other Dependencies
- No npm packages, no build tools, no frameworks.
- All other code is vanilla HTML, CSS, and JavaScript.
- The site is fully static and deploys directly to GitHub Pages.

## Notes
- If the CDN is down, Three.js won't load, but the site remains functional (3D background absent).
- For offline development, download Three.js locally and update the script src.
- Last checked: September 26, 2025.</content>
<parameter name="filePath">/home/michele/michelemonti.me/personal-website/DEPENDENCIES.md