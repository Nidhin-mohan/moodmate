# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoodMate is a full-stack mood tracking application. Monorepo with two independent sub-projects: `client/` (React) and `server/` (Express). Each has its own `package.json` — there is no root-level package.json.

## Commands

### Server (`cd server`)
```bash
npm run dev          # ts-node-dev with live reload
npm run build        # tsc → compiles to dist/
npm start            # node dist/index.js (production)
npm test             # jest (runs all __tests__/*.test.ts)
npm run test:watch   # jest --watch
# Run a single test file:
npx jest src/__tests__/auth.test.ts
```

### Client (`cd client`)
```bash
npm run dev          # vite dev server with HMR
npm run build        # tsc -b && vite build
npm run lint         # eslint
npm run preview      # vite preview (serve production build)
```

### Docker (from root)
```bash
docker-compose up    # Starts mongo, backend (:5000), frontend (:5173)
```

## Architecture Notes

### Server (`server/src/`)

Express + TypeScript + Mongoose + MongoDB. Follows a layered pattern:

- **Routes** → **Controllers** (thin: parse/validate → call service → respond) → **Services** (business logic, DB queries)
- **Validations**: Zod schemas in `validations/` — validated in controllers before calling services
- **Error handling**: Custom error classes in `utils/customError.ts` (BadRequestError, UnauthorizedError, NotFoundError, ConflictError). Central `errorHandler` middleware catches all. `ZodError` gets special handling with field-level detail. Async handlers wrapped via `utils/asyncHandler.ts` which also adds structured logging per handler.
- **Auth**: Stateless JWT (Bearer token, 7-day expiry). `authMiddleware.ts` verifies token, fetches user from DB (excluding password), and attaches `req.user`. Auth routes rate-limited (20 req/15min per IP).
- **Models**: `User` (bcrypt pre-save hook with salt rounds 10, `matchPassword` method, three roles: admin/user/therapist) and `MoodLog` (compound index `{user:1, date:-1}` for performant per-user time-ordered queries).
- **Env validation**: `config/env.ts` uses Zod to validate all env vars at startup — app fails fast with human-readable errors per field.
- **Startup**: `index.ts` connects DB first, then starts HTTP server. Registers `SIGTERM`/`SIGINT` handlers that close the HTTP server and Mongoose connection gracefully, with a 10-second force-exit safety net.
- **Middleware stack order**: helmet → cors → json body parser (16kb limit) → morgan → routes → notFound → errorHandler.

API base path: `/api/v1/`. Auth routes at `/api/v1/auth/`, mood routes at `/api/v1/mood/`.

**Stats endpoint**: `GET /api/v1/mood/stats?days=30` runs two parallel MongoDB aggregation pipelines — one for numeric averages (intensity, energy, sleep), one for mood-type breakdown. All mood queries include `{ user: userId }` filter to enforce ownership.

### Client (`client/src/`)

React 18 + TypeScript + Vite 6 + Tailwind CSS v3 + shadcn/ui (new-york style, zinc base).

- **Provider wrapping order** (outermost → innermost): `StrictMode` → `AuthProvider` → `BrowserRouter` → `ToastProvider` + `App`. AuthProvider is outside BrowserRouter so auth state is available at the router level.
- **Routing**: Data-driven via `routes/routes.json` config. `AppRouter` reads JSON, lazy-loads components via `componentMap.ts` (all pages are code-split with `React.lazy`), checks role-based access with `canAccess()`, wraps protected routes in `<ProtectedRoute>`. To add a new route: one entry in `routes.json` + one entry in `componentMap.ts`.
- **Auth state**: React Context (`context/AuthContext.tsx`), token stored under `"token"` and user under `"user"` in localStorage. State initialized synchronously from localStorage — no async fetch, no loading flash. `isLoggedIn` is derived from `!!token`.
- **API layer**: Axios instance in `api/index.ts`. Base URL from `VITE_API_BASE_URL` env var. Request interceptor reads token from localStorage (not React state — avoids stale closures). Response interceptor does hard `window.location.href = "/login"` redirect on 401.
- **Services**: `services/authServices.ts` and `services/moodLogService.ts` wrap API calls. Error pattern: catch `AxiosError`, extract `response.data.message`, throw plain `Error` with user-friendly fallback.
- **UI**: shadcn/ui primitives in `components/ui/`, layout shell in `components/layout/`. All colors use CSS custom properties via `hsl(var(--xyz))` — theme changes only require updating CSS variables. Dark mode via Tailwind `class` strategy.

### Path Alias

Both client and server use `@/` → `./src/`. Client resolves via Vite config; server via `tsconfig-paths`.

## Testing

Server tests use **mongodb-memory-server** for isolated in-memory MongoDB — no external DB needed.
- `__tests__/env-setup.ts`: Injects test env vars before module loading (Jest `setupFiles`) — critical so `config/env.ts` gets valid test vars without a real `.env`.
- `__tests__/setup.ts`: MongoMemoryServer lifecycle. `afterEach` drops all collections for isolation. `afterAll` shuts down in-memory server.
- `__tests__/helpers.ts`: Shared supertest request, `createAuthenticatedUser()`, `validMoodLog` fixture.
- Tests: `auth.test.ts` (integration), `mood.test.ts` (integration), `validation.test.ts` (unit/Zod, no DB/HTTP).
- Jest config: 30-second timeout for slow in-memory DB startup, `silent: true` suppresses console noise.

## Environment Variables

Server (`server/.env`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/moodmate
JWT_SECRET=<min 16 chars, enforced by Zod>
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

Client (`client/.env`):
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Deployment Steps

### Local Development
1. Start MongoDB locally or via Docker (`docker-compose up mongo`)
2. Create `server/.env` and `client/.env` from their `.env.example` files
3. `cd server && npm install && npm run dev`
4. `cd client && npm install && npm run dev`
5. Client runs at `http://localhost:5173`, server at `http://localhost:5000`

### Docker (Full Stack)
1. Create `server/.env` with `MONGO_URI=mongodb://mongo:27017/moodmate` (use Docker service name `mongo`, not `localhost`)
2. `docker-compose up --build` from root
3. Frontend: `http://localhost:5173` (nginx), Backend: `http://localhost:5000`, MongoDB: `localhost:27017`
4. MongoDB data persists in the `mongo_data` Docker volume

### Production Considerations
- **Client**: Vite replaces `import.meta.env.*` at **build time**, not runtime. `VITE_API_BASE_URL` must be set before `npm run build` or `docker build`. It cannot be changed after the bundle is built.
- **Server**: Multi-stage Docker build — stage 1 compiles TS, stage 2 is a lean `node:20-alpine` image with only `dist/`, `node_modules/`, and `package.json`.
- **Client**: Multi-stage Docker build — stage 1 builds with Vite, stage 2 serves via `nginx:alpine` with SPA fallback (`try_files $uri /index.html`).
- **CORS**: `CORS_ORIGINS` in server `.env` must include the production frontend domain.

## Tradeoff Explanations

- **Data-driven routing (JSON config) vs JSX routes**: Routes are declared in `routes.json` rather than JSX. This adds indirection (two files to touch per route) but centralizes route metadata (roles, layouts) and makes it easy to add role-based access without scattering auth checks across components.
- **localStorage for auth vs httpOnly cookies**: Tokens are stored in localStorage and sent via Authorization header. This is simpler to implement and works across subdomains, but is vulnerable to XSS. The `withCredentials: true` on Axios is set defensively for a future migration to cookie-based auth.
- **401 interceptor uses `window.location.href` vs React navigation**: The Axios interceptor can't access React context or `useNavigate`. A hard redirect guarantees a clean slate (full re-render) on session expiry. The tradeoff is losing any in-memory state.
- **`componentMap` typed as `any`**: The route config references components by string key. TypeScript can't narrow `componentMap[r.component]` to a valid React component without the `as any` escape hatch. This is a known compromise for the data-driven routing pattern.
- **Separate tag arrays vs single tags array**: `tagsPeople`, `tagsPlaces`, `tagsEvents` are stored as three separate arrays rather than a flat `tags[]` with types. This makes aggregation queries simpler (no nested filtering) at the cost of a more rigid schema.
- **Service layer error wrapping**: Services catch `AxiosError` and throw plain `Error`. This hides transport details from consumers but loses the original status code. The tradeoff favors simpler error handling in UI components.
- **No update/delete exposed in UI**: Users cannot edit or delete mood logs from the frontend. Each mood change requires a new log entry. This is intentional — immutable logs preserve the full history needed for mood pattern analysis and prevent retroactive data manipulation.

## Lessons Learned

- **localStorage key consistency is critical**: The token key used by the auth context (`"token"`) and the Axios interceptor must match exactly. A mismatch means the Bearer token is never attached, causing silent 401s on every protected request — a failure mode that looks like a backend bug but is purely frontend.
- **Vite env vars must be prefixed with `VITE_`**: Unlike Create React App's `REACT_APP_` prefix, Vite uses `VITE_`. Using the wrong prefix means the variable is silently `undefined` at runtime. Also, `import.meta.env` is resolved at build time — the value is baked into the bundle.
- **API path alignment**: Client service functions and server route definitions must agree on paths. The client's base URL already includes `/api/v1`, so service calls should use relative paths like `/auth/login` and `/mood`, not `/api/v1/auth/login`.
- **Form data types must match API types**: If the backend expects `string[]` for tags but the form collects plain `string`, conversion (split + trim + filter) must happen in `onSubmit` before calling the service. Type mismatches here cause silent 400 validation errors.
- **Pre-save hooks and `isModified` guards**: The User model's bcrypt pre-save hook checks `this.isModified("password")` to avoid double-hashing when updating other fields. Without this guard, any user update would corrupt the password.
- **Route ordering matters**: `/mood/stats` must be declared before `/mood/:id` in the router. Otherwise Express matches `stats` as an `:id` parameter and the stats endpoint becomes unreachable.
- **`git rm --cached` for tracked `.env` files**: Adding `.env` to `.gitignore` does not untrack files already committed. You must explicitly `git rm --cached <file>` to stop tracking without deleting the local file.

## Incident Simulations

### Scenario: All authenticated API calls return 401
**Likely cause**: Token not being attached to requests. Check that:
1. `AuthContext` stores the token under the same localStorage key that `api/index.ts` reads (currently `"token"`).
2. The request interceptor in `api/index.ts` is correctly reading and formatting the `Authorization: Bearer <token>` header.
3. The token is not expired (7-day expiry).
4. The JWT_SECRET in `server/.env` hasn't changed since the token was issued.

### Scenario: Mood log creation returns 400 validation error
**Likely cause**: Type mismatch between form data and Zod schema. Check:
1. Tags fields (`tagsPeople`, `tagsPlaces`, `tagsEvents`) must be `string[]`, not comma-separated strings.
2. `intensity` (1-10), `energyLevel` (1-10), `sleepHours` (0-24), `sleepQuality` (1-5) must be within their valid ranges.
3. `mood` is a required string and must not be empty.

### Scenario: Server won't start — exits immediately
**Likely cause**: Environment validation failure. Check:
1. `server/.env` exists and is properly formatted (no quotes around values needed).
2. `JWT_SECRET` is at least 16 characters.
3. `MONGO_URI` is set and MongoDB is reachable at that address.
4. Look at the console output — `config/env.ts` prints the exact failing fields before `process.exit(1)`.

### Scenario: Frontend routes return 404 on page refresh (production)
**Likely cause**: Missing SPA fallback in the web server. The nginx config must have `try_files $uri /index.html` to route all non-file paths to React Router. This is already configured in `client/nginx.conf` for the Docker setup but must be replicated in any other hosting environment.

### Scenario: Docker frontend can't reach backend API
**Likely cause**: `VITE_API_BASE_URL` mismatch. Remember:
1. The frontend runs in the **user's browser**, not inside the Docker container. So `http://backend:5000` won't work — the browser can't resolve Docker service names.
2. The URL must be reachable from the browser: `http://localhost:5000/api/v1` for local Docker, or the production backend URL.
3. This value is baked in at build time. Changing `.env` requires rebuilding the client image.

### Scenario: Tests fail with "MongoMemoryServer" timeout
**Likely cause**: First run downloads the MongoDB binary (~100MB). Check:
1. Internet connectivity during test run.
2. Increase `testTimeout` in `jest.config.ts` if needed (currently 30s).
3. On CI, cache `~/.cache/mongodb-binaries` between runs to avoid re-download.
