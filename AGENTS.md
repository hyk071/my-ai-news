# Repository Guidelines

## Project Structure & Module Organization
- `pages/`: Next.js pages and API routes (e.g., `pages/api/search.js`).
- `components/`: UI components (PascalCase files).
- `hooks/`: React hooks (e.g., `hooks/useSearch.js`).
- `lib/`: Core logic, search/indexing, test scripts (`lib/test-*.js`).
- `data/`: Content sources (e.g., `data/articles.json`).
- `scripts/`: Dev utilities and the test runner (`scripts/run-all-tests.js`).
- `styles/`, `utils/`, `docs/`: Styling, helpers, and documentation.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js in development.
- `npm run build`: Production build.
- `npm start`: Run the built app.
- `npm run lint`: Lint with Next.js Core Web Vitals config.
- `npm test`: Run stable Node-based tests via `scripts/run-all-tests.js`.
- `npm run test:integration` / `test:monitoring`: Run targeted test suites.
- `npm run monitoring` / `monitoring:demo`: Launch the monitoring dashboard.

Require Node.js ≥ 16. Example: `NODE_ENV=development npm run dev`.

## Coding Style & Naming Conventions
- JavaScript (ES modules). 2-space indentation, semicolons, single quotes.
- Components: PascalCase (e.g., `ArticleCard.js`). Hooks: `use*` camelCase.
- API routes: lower-kebab or bracketed routes under `pages/api/`.
- Linting: keep `next/core-web-vitals` clean (`npm run lint`).

## Testing Guidelines
- Tests are Node scripts under `lib/` (`lib/test-*.js`) executed by the runner.
- Add new tests as `lib/test-your-area.js` and include them in the allowlist in `scripts/run-all-tests.js` if they’re stable.
- Run all tests: `npm test`. Save a JSON report: `npm run test:save`.
- Prefer deterministic tests; avoid network calls. Log clear pass/fail output and exit with proper codes.

## Commit & Pull Request Guidelines
- Commits: concise, present-tense summaries (e.g., "검색 성능 최적화"). Use conventional prefixes when relevant (e.g., `fix(deps): ...`).
- PRs: include a clear description, linked issues, test evidence (logs/screenshots), and UI screenshots for visible changes.
- Keep diffs scoped; update docs when behavior or APIs change.

## Security & Configuration Tips
- Environment: use `.env.local` (e.g., `NEXT_ADMIN_USER`, `NEXT_ADMIN_PASS` for `/admin` basic auth via `middleware.js`).
- APIs should return JSON with proper `Content-Type`; use `pages/debug-search.js` to diagnose.

## Architecture Overview
- Next.js app with serverless API routes under `pages/api/*` consuming modules in `lib/`.
- Client flow: `hooks/useSearch` → `/api/search` → `lib/search-index`/algorithms → JSON.
- Data: primary store is `data/articles.json`; in-memory caches for indices and metadata.
- Admin basic auth via `middleware.js` using `NEXT_ADMIN_*` envs. Monitoring utilities in `scripts/`.

## How Search Works
- Index: `lib/search-index` loads/builds an index with `articles`, `termIndex`, and `metadata` (authors, sources, dateRange). Cached in memory.
- API: `pages/api/search.js` parses query/filters/sort/page; runs `performSearch` (or advanced modes) from `lib/search-algorithms` and applies pagination.
- Enrichment: Slug results are expanded to full articles by reading `data/articles.json`.
- Response: `{ articles, pagination, filters, searchParams, suggestions? }` with proper `application/json` headers.
- Metadata: `pages/api/search/metadata.js` exposes authors/models/date range and optional detailed stats (cached).
