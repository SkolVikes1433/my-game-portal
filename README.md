
# VOID NETWORK V6

A dark-themed game portal with searchable games, tab appearance presets, and basic offline support.

## Files

- `index.html` — Main game portal
- `settings.html` — Browser tab appearance settings
- `sw.js` — Service worker for offline caching
- `void-logo.png` — Website favicon and logo
- `khan-academy.jpg` — Optional image asset

## Installation

1. Upload the files to the same GitHub repository.
2. Make sure `index.html`, `settings.html`, and `sw.js` are in the same directory.
3. Keep the existing image files if you use them.
4. Commit and push your changes.
5. Enable GitHub Pages in your repository settings if it is not already enabled.
6. Open the HTTPS GitHub Pages website.
7. Visit the site while online so its files can be cached.

## Offline support

The service worker attempts to cache the portal's HTML pages and local assets.

For best results:
- Open the portal while connected to the internet.
- Visit the settings page at least once.
- Reload the website after the service worker installs.
- Test offline behavior after the initial visit.

## Important limitations

The game buttons embed external URLs in an iframe.

A game may not load inside an iframe if its hosting website blocks embedding. Use the open-in-new-tab button in that case.

Caching the portal does not automatically download an entire external game. A game may require JavaScript, images, audio, WebAssembly, save files, or other resources from its original host.

Reliable offline game support requires the complete game files to be available locally and any required external dependencies to support offline use.

Only host game files that you have permission to redistribute.
