# Moods Visualization

A small static D3.js visualization (stacked area chart) for mood tracking data. This repository contains the site assets and scripts to prepare a clean `publish/` folder and deploy to GitHub Pages using `gh-pages`.

## Quick overview

- Project type: static site (vanilla JS + D3)
- Node: Uses ES modules (`package.json` contains `"type": "module"`)
- Publish workflow: `npm run prepare:pages` builds a `publish/` folder, then `gh-pages` publishes that folder to GitHub Pages.

## Prerequisites

- Node.js (tested with Node 20.x)
- npm (bundled with Node)
- git configured for the repository and a remote on GitHub

## Useful scripts

All scripts are defined in `package.json`.

- Serve with Python (simple):

```bash
npm run serve
# serves the project root on http://localhost:8000
```

- Serve with a Node static server (via npx http-server):

```bash
npm run serve-node
# serves the project root on http://localhost:8000
```

- Prepare the `publish/` folder (used by deploy):

```bash
npm run prepare:pages
# runs node ./scripts/prepare-pages.js
```

- Deploy to GitHub Pages:

```bash
npm run deploy
# runs prepare:pages then npx gh-pages -d publish
```

- Preview the prepared `publish/` folder locally:

```bash
npm run preview
# serves publish/ on port 5000 via npx serve
```

## About `scripts/prepare-pages.js`

This script copies the repository's static assets into a fresh `publish/` directory while excluding development files like `node_modules`, `.git`, and the `scripts` folder itself.

Notable implementation detail and recent fix:

- The repository uses ES modules (`"type": "module"`), so CommonJS globals like `__dirname` are not available.
- `scripts/prepare-pages.js` therefore uses `fileURLToPath(import.meta.url)` + `dirname(...)` to compute the script directory in an ES-module-compatible way. This prevents the `ReferenceError: __dirname is not defined in ES module scope` error when running `node`.

If you prefer CommonJS for that script, you can rename it to `prepare-pages.cjs` and convert imports to `require()`.

## Troubleshooting

- Error: `ReferenceError: __dirname is not defined in ES module scope`

  - Cause: running a `.js` file under `type: "module"` and using `__dirname`.
  - Fix: use `fileURLToPath(import.meta.url)` (already applied), or rename to `.cjs` and use CommonJS.

- Error: `npx gh-pages` fails to publish
  - Make sure `gh-pages` is installed (it's listed in `devDependencies`).
  - Ensure you have pushed your branch to GitHub and have permission to push `gh-pages` branches.
  - Run `npx gh-pages -d publish --repo <repo-url>` to explicitly set the repo if needed.

## Local verification

1. Prepare the folder:

```bash
npm run prepare:pages
```

2. Preview the prepared site:

```bash
npm run preview
# open http://localhost:5000
```

3. Deploy (will run prepare automatically):

```bash
npm run deploy
```

## CI / automation suggestions

- Add a CI job that runs `npm run prepare:pages` to ensure the script keeps working across Node upgrades.
- Optionally run `npx gh-pages -d publish --no-silent` in CI if you want to publish from a CI runner with appropriate auth.

## Contributing

Small project — open a PR with fixes or improvements to the visualization or build scripts.

## License

Include your preferred license here (e.g., MIT). If you want me to add an `LICENSE` file, tell me which license to use and I can create it.

---

If you'd like, I can also:

- Add a small GitHub Actions workflow to run `npm run prepare:pages` on push/PR,
- Add a `predeploy` script or more robust publish checks,
- Create a `prepare-pages.cjs` CommonJS alternative if you need compatibility for older node setups.

Which would you like next?
