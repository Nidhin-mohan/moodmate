# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoodMate is a full-stack mood tracking application. Monorepo with two independent sub-projects: `client/` (React) and `server/` (Express). Each has its own `package.json` — there is no root-level package.json.

## Commands

### Server (`cd server`)
```bash
npm run dev          # ts-node-dev with live reload
npm run debug        # ts-node-dev with --inspect (Node debugger)
npm run build        # tsc → compiles to dist/
npm start            # node dist/index.js (production)
npm test             # jest (runs all __tests__/*.test.ts)
npm run test:watch   # jest --watch
# Run a single test file:
npx jest src/__tests__/auth.test.ts
npm run lint         # eslint — check for lint issues
npm run lint:fix     # eslint — auto-fix issues
npm run format       # prettier — format all source files
npm run format:check # prettier — check formatting (CI-friendly)
npm run test:coverage # jest with coverage report + thresholds
npm run seed <userId> # seed 60 days of mood logs for a user
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
docker-compose up --build   # Starts backend (:5000) and frontend (:3000). No MongoDB — provide MONGO_URI externally.
```

## Architecture Notes

### Server (`server/src/`)

Express + TypeScript + Mongoose + MongoDB. Follows a layered pattern:

- **Routes** → **Controllers** (thin: parse/validate → call service → respond) → **Services** (business logic) → **Repositories** (data access)
- **Repositories**: Generic `BaseRepository<T>` provides CRUD (findAll with filter/sort/pagination, findById, create, updateById, deleteById, exists) for every collection. `UserRepository` and `MoodLogRepository` extend it with collection-specific queries. Repositories export singleton instances (`export const userRepository = new UserRepository()`). Services never import Mongoose models directly — all DB access goes through repositories.
- **Validations**: Zod schemas in `validations/` — validated in controllers before calling services.
- **Error handling**: Custom error classes in `utils/customError.ts` (BadRequestError, UnauthorizedError, NotFoundError, ConflictError) — all extend a base `CustomError` class with `statusCode` and `errorCode` properties. Central `errorHandler` middleware catches all. `ZodError` gets special handling with field-level detail. Async handlers wrapped via `utils/asyncHandler.ts` which creates a child Pino logger with `{ task: taskName, requestId }` and logs "started", "completed", and "failed" per handler.
- **Auth**: Stateless JWT (Bearer token, 7-day expiry). `authMiddleware.ts` verifies token, fetches user via `userRepository.findByIdSecure()` (excluding password), and attaches `req.user`. Three distinct failure paths: missing/malformed header, valid token but deleted user, invalid/expired token.
- **Rate limiting**: Auth routes rate-limited (20 req/15min per IP). Health endpoint rate-limited (10 req/1min per IP).
- **Models**: `User` (bcrypt pre-save hook with salt rounds 10, `matchPassword` method, three roles: admin/user/therapist) and `MoodLog` (compound index `{user:1, date:-1}` for performant per-user time-ordered queries).
- **Env validation**: `config/env.ts` uses Zod to validate all env vars at startup — app fails fast with human-readable errors per field. PORT defaults to 5000.
- **Startup**: `index.ts` connects DB first, then starts HTTP server. Registers `SIGTERM`/`SIGINT` handlers that close the HTTP server and Mongoose connection gracefully, with a 10-second force-exit safety net.
- **Middleware stack order**: requestId → helmet → cors → json body parser (16kb limit) → morgan → routes → notFound → errorHandler.
- **Logging**: Pino structured logger (JSON in production, pretty-printed in dev, silent in test). Request ID tracing via `x-request-id` header (auto-generated UUID if not provided). Error responses include `requestId` for log correlation.
- **API docs**: Swagger UI at `GET /api-docs` (non-production only). OpenAPI 3.0 spec in `config/swagger.ts`.
- **ObjectId validation**: `validateObjectId()` middleware on `/:id` routes returns clean 400 instead of Mongoose cast errors.
- **Constants**: `constants/httpStatusCodes.ts` exports `HTTP_STATUS` enum and `MESSAGES` map used throughout controllers and error classes.

API base path: `/api/v1/`. Auth routes at `/api/v1/auth/`, mood routes at `/api/v1/mood/`.

**Health endpoint**: `GET /health` — returns `{ success, status, db, uptime }`. Checks `mongoose.connection.readyState` (1 = connected). Returns 200 if healthy, 503 if unhealthy. Rate-limited to 10 req/min. Used for Docker health checks and load balancer probes.

**Stats endpoint**: `GET /api/v1/mood/stats?days=30` — `MoodLogRepository.getStatsByUser()` runs two parallel MongoDB aggregation pipelines — one for numeric averages (intensity, energy, sleep), one for mood-type breakdown. All mood queries include `{ user: userId }` filter to enforce ownership.

**Full API route table**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No (rate-limited) | DB health check |
| POST | `/api/v1/auth/register` | No (rate-limited) | Register |
| POST | `/api/v1/auth/login` | No (rate-limited) | Login, returns JWT |
| GET | `/api/v1/auth/profile` | JWT | Get own profile |
| POST | `/api/v1/mood` | JWT | Create mood log |
| GET | `/api/v1/mood` | JWT | List logs (paginated, filterable by date range and mood) |
| GET | `/api/v1/mood/stats` | JWT | Aggregated stats |
| GET | `/api/v1/mood/:id` | JWT | Get single log |
| PUT | `/api/v1/mood/:id` | JWT | Update log |
| DELETE | `/api/v1/mood/:id` | JWT | Delete log |

### Client (`client/src/`)

React 18 + TypeScript + Vite 6 + Tailwind CSS v3 + shadcn/ui (new-york style, zinc base).

- **Provider wrapping order** (outermost → innermost): `StrictMode` → `AuthProvider` → `BrowserRouter` → `ToastProvider` + `App`. AuthProvider is outside BrowserRouter so auth state is available at the router level.
- **Routing**: Data-driven via `routes/routes.json` config. `AppRouter` reads JSON, lazy-loads components via `componentMap.ts` (all pages are code-split with `React.lazy`), checks role-based access with `canAccess()`, wraps protected routes in `<ProtectedRoute>`. To add a new route: one entry in `routes.json` + one entry in `componentMap.ts`.
- **Auth state**: React Context (`context/AuthContext.tsx`), token stored under `"token"` and user under `"user"` in localStorage. State initialized synchronously from localStorage — no async fetch, no loading flash. `isLoggedIn` is derived from `!!token`.
- **API layer**: Axios instance in `api/index.ts`. Base URL from `VITE_API_BASE_URL` env var, falls back to `"/api/v1"` if not set (allows nginx proxy to handle routing in Docker). Request interceptor reads token from localStorage (not React state — avoids stale closures). Response interceptor does hard `window.location.href = "/login"` redirect on 401.
- **Services**: `services/authServices.ts` and `services/moodLogService.ts` wrap API calls. Error pattern: catch `AxiosError`, extract `response.data.message`, throw plain `Error` with user-friendly fallback.
- **UI**: shadcn/ui primitives in `components/ui/`, layout shell in `components/layout/`. All colors use CSS custom properties via `hsl(var(--xyz))` — theme changes only require updating CSS variables. Dark mode via Tailwind `class` strategy.
- **Toast notifications**: react-toastify configured at top-right position with 3000ms auto-close. `showToast()` helper in `utils/toast.tsx` is callable from anywhere without hooks.
- **Forms**: react-hook-form v7 + zodResolver + Zod for validation. Tag fields collected as comma-separated strings, converted to `string[]` in `onSubmit`.

**Client routes** (from `routes/routes.json`):

| Path | Component | Access | Layout |
|------|-----------|--------|--------|
| `/` | Home | public | — |
| `/login` | Login | public | — |
| `/signup` | SignUp | public | — |
| `/dashboard` | Dashboard | user | MainLayout |
| `/mood-tracking` | MoodTrackingForm | user | MainLayout |
| `/mood-history` | MoodHistory | user | MainLayout |
| `/profile` | UserProfile | user | MainLayout |

### Linting & Formatting (Server)

- **ESLint**: Flat config in `server/eslint.config.mjs` (`.mjs` — uses ES module format). Uses `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier` (disables rules that conflict with Prettier). Key rules: `@typescript-eslint/no-unused-vars` (warn, ignores `_`-prefixed args), `@typescript-eslint/no-explicit-any` (warn). Ignores `dist/`, `node_modules/`, `coverage/`.
- **Prettier**: Config in `server/.prettierrc`. Single quotes, trailing commas, 100-char print width, 2-space indent, LF line endings, `arrowParens: "always"`, `bracketSpacing: true`. Ignores `dist/`, `node_modules/`, `coverage/` via `.prettierignore`.
- **Pre-commit hooks**: Husky + lint-staged at repo root (`.husky/pre-commit` runs `cd server && npx lint-staged`). Staged `.ts` files are auto-formatted with Prettier and lint-fixed with ESLint on commit.

### Path Alias

Both client and server use `@/` → `./src/`. Client resolves via Vite config (`resolve.alias`); server via `tsconfig-paths`.

### TypeScript Configuration

- **Server**: `target: ES2020`, `module: commonjs`, `strict: true`, `outDir: ./dist`, `rootDir: ./src`, `sourceMap: true`, `esModuleInterop: true`.
- **Client**: Project references (`tsconfig.app.json` + `tsconfig.node.json`). Path alias `@/` → `./src/` in `compilerOptions.paths`.

## CI/CD

Three GitHub Actions workflows in `.github/workflows/`:

### CI (`ci.yml`)
**Triggers**: Push to `main` OR pull request to `main`.

Runs two parallel jobs:

**Server job** (`working-directory: server`):
1. Checkout → Node 20 setup
2. Cache `~/.npm` (key: `server-npm-${{ hashFiles('server/package-lock.json') }}`)
3. Cache `~/.cache/mongodb-binaries` (key: `mongodb-binaries-v7`) — avoids re-downloading MongoMemoryServer binary on every run
4. `npm ci` → `npm run lint` → `npm test` → `npm run build`

**Client job** (`working-directory: client`):
1. Checkout → Node 20 setup
2. Cache `~/.npm` (key: `client-npm-${{ hashFiles('client/package-lock.json') }}`)
3. `npm ci` → `npm run lint` → `npm run build`

### CD Backend (`cd-backend.yml`)
**Triggers**: Push to `main` where paths include `server/**` or `docker-compose.prod.yml`.

**Permissions**: `contents: read`, `id-token: write` (for AWS OIDC).

**Steps**:
1. Configure AWS credentials via OIDC role assumption (`AWS_ROLE_ARN_ECR` secret)
2. Login to AWS ECR (`aws-actions/amazon-ecr-login@v2`)
3. Build & push Docker image to ECR:
   - Tag 1: `{registry}/moodmate/backend:{github.sha}`
   - Tag 2: `{registry}/moodmate/backend:latest`
4. SCP `docker-compose.prod.yml` to EC2 (uses `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` secrets)
5. SSH into EC2 → ECR login → `docker compose -f docker-compose.prod.yml up -d --pull always`

**Required GitHub secrets**: `AWS_ROLE_ARN_ECR`, `AWS_REGION`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.

### CD Frontend (`cd-frontend.yml`)
**Triggers**: Manual `workflow_dispatch` OR push to `main` where paths include `client/**`.

**Permissions**: `contents: read`, `id-token: write`.

**Steps**:
1. Checkout → Node 20 → Cache `~/.npm` → `npm ci`
2. Build with Vite: `npm run build` with `VITE_API_BASE_URL` injected from secrets (baked into bundle at build time)
3. Configure AWS credentials via OIDC role assumption (`AWS_ROLE_ARN_S3` secret)
4. `aws s3 sync client/dist/ s3://moodmate-app-frontend --delete`
5. CloudFront cache invalidation: `aws cloudfront create-invalidation --distribution-id {id} --paths "/*"`

**Required GitHub secrets**: `AWS_ROLE_ARN_S3`, `AWS_REGION`, `VITE_API_BASE_URL`, `CLOUDFRONT_DISTRIBUTION_ID`.

## Testing

Server tests use **mongodb-memory-server** for isolated in-memory MongoDB — no external DB needed.
- `__tests__/env-setup.ts`: Injects test env vars before module loading (Jest `setupFiles`) — critical so `config/env.ts` gets valid test vars without a real `.env`.
- `__tests__/setup.ts`: MongoMemoryServer lifecycle. `afterEach` drops all collections for isolation. `afterAll` shuts down in-memory server.
- `__tests__/helpers.ts`: Shared supertest request, `createAuthenticatedUser()`, `validMoodLog` fixture.
- Tests: `auth.test.ts` (integration), `mood.test.ts` (integration), `validation.test.ts` (unit/Zod, no DB/HTTP).
- Jest config (`jest.config.ts`): `preset: ts-jest`, 30-second timeout for slow in-memory DB startup, `silent: true` suppresses console noise. Coverage excludes `__tests__/`, `@types/`, and `seeds/`.
- **Coverage**: `npm run test:coverage` generates reports in `coverage/` (text + lcov). Thresholds: 50% branches, 60% functions/lines/statements.

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

Both have `.env.example` files as templates.

## Deployment

### Local Development
1. Start MongoDB locally (must be running externally — not included in docker-compose)
2. Create `server/.env` and `client/.env` from their `.env.example` files
3. `cd server && npm install && npm run dev` — server at `http://localhost:5000`
4. `cd client && npm install && npm run dev` — client at `http://localhost:5173`

### Docker (Full Stack)
1. Create `server/.env` with `MONGO_URI` pointing to an accessible MongoDB instance (e.g. MongoDB Atlas or a host-network MongoDB — there is no mongo service in docker-compose)
2. `docker-compose up --build` from root
3. Frontend: `http://localhost:3000` (nginx), Backend: `http://localhost:5000`
4. Docker health check on backend: `wget --spider http://localhost:5000/health` (interval 30s, retries 3, start period 10s)
5. Frontend depends on backend health check passing before starting
6. Client nginx config includes `/api/` proxy to backend + SPA fallback (`try_files $uri /index.html`)

### Production (docker-compose.prod.yml)
- Backend-only compose file — uses pre-built ECR image (`${ECR_IMAGE:-moodmate-backend:latest}`)
- Loads env from `.env` file on the EC2 host
- Frontend deployed separately to S3 + CloudFront (not in compose)
- **Client**: Vite replaces `import.meta.env.*` at **build time**, not runtime. `VITE_API_BASE_URL` must be set before `npm run build` or `docker build`. It cannot be changed after the bundle is built.
- **Server**: Multi-stage Docker build — stage 1 compiles TS, stage 2 is a lean `node:20-alpine` image with only `dist/`, `node_modules/`, and `package.json`.
- **Client**: Multi-stage Docker build — stage 1 builds with Node 20.11.1, stage 2 serves via `nginx:1.25-alpine` with SPA fallback and API proxy.
- **CORS**: `CORS_ORIGINS` in server `.env` must include the production frontend domain.

### Production Architecture
```
User → CloudFront → S3 (static frontend)
                  ↘
User → EC2 (Docker: backend container) → MongoDB (external)
```

## Tradeoff Explanations

- **Data-driven routing (JSON config) vs JSX routes**: Routes are declared in `routes.json` rather than JSX. This adds indirection (two files to touch per route) but centralizes route metadata (roles, layouts) and makes it easy to add role-based access without scattering auth checks across components.
- **localStorage for auth vs httpOnly cookies**: Tokens are stored in localStorage and sent via Authorization header. This is simpler to implement and works across subdomains, but is vulnerable to XSS. The `withCredentials: true` on Axios is set defensively for a future migration to cookie-based auth.
- **401 interceptor uses `window.location.href` vs React navigation**: The Axios interceptor can't access React context or `useNavigate`. A hard redirect guarantees a clean slate (full re-render) on session expiry. The tradeoff is losing any in-memory state.
- **`componentMap` typed as `any`**: The route config references components by string key. TypeScript can't narrow `componentMap[r.component]` to a valid React component without the `as any` escape hatch. This is a known compromise for the data-driven routing pattern.
- **Separate tag arrays vs single tags array**: `tagsPeople`, `tagsPlaces`, `tagsEvents` are stored as three separate arrays rather than a flat `tags[]` with types. This makes aggregation queries simpler (no nested filtering) at the cost of a more rigid schema.
- **Service layer error wrapping**: Services catch `AxiosError` and throw plain `Error`. This hides transport details from consumers but loses the original status code. The tradeoff favors simpler error handling in UI components.
- **No update/delete exposed in UI**: Users cannot edit or delete mood logs from the frontend. Each mood change requires a new log entry. This is intentional — immutable logs preserve the full history needed for mood pattern analysis and prevent retroactive data manipulation.
- **Repository pattern with BaseRepository**: All DB access goes through repositories. A generic `BaseRepository<T>` provides CRUD for every collection; child repos only add custom queries. Services import from `repositories/`, never from `models/` (except type interfaces). To add a new collection: create model → extend `BaseRepository` → get full CRUD for free. If switching databases, only `BaseRepository` and child implementations need rewriting — services stay untouched.
- **No MongoDB in docker-compose**: The compose file does not include a MongoDB service. This keeps the setup flexible (local Mongo, Atlas, or host-network instance) but requires users to provide their own `MONGO_URI`. For local dev, run MongoDB separately.
- **User lookup on every authenticated request**: `authMiddleware` calls `userRepository.findByIdSecure()` on every request to verify the user still exists. This catches deleted users immediately but adds a DB round-trip per request. A cache or token-only approach would be faster but risks stale user state.

## Lessons Learned

- **localStorage key consistency is critical**: The token key used by the auth context (`"token"`) and the Axios interceptor must match exactly. A mismatch means the Bearer token is never attached, causing silent 401s on every protected request — a failure mode that looks like a backend bug but is purely frontend.
- **Vite env vars must be prefixed with `VITE_`**: Unlike Create React App's `REACT_APP_` prefix, Vite uses `VITE_`. Using the wrong prefix means the variable is silently `undefined` at runtime. Also, `import.meta.env` is resolved at build time — the value is baked into the bundle.
- **API path alignment**: Client service functions and server route definitions must agree on paths. The client's base URL already includes `/api/v1`, so service calls should use relative paths like `/auth/login` and `/mood`, not `/api/v1/auth/login`. The client falls back to `"/api/v1"` if `VITE_API_BASE_URL` is not set, which works when nginx proxies `/api/` to the backend.
- **Form data types must match API types**: If the backend expects `string[]` for tags but the form collects plain `string`, conversion (split + trim + filter) must happen in `onSubmit` before calling the service. Type mismatches here cause silent 400 validation errors.
- **Pre-save hooks and `isModified` guards**: The User model's bcrypt pre-save hook checks `this.isModified("password")` to avoid double-hashing when updating other fields. Without this guard, any user update would corrupt the password.
- **Route ordering matters**: `/mood/stats` must be declared before `/mood/:id` in the router. Otherwise Express matches `stats` as an `:id` parameter and the stats endpoint becomes unreachable.
- **`git rm --cached` for tracked `.env` files**: Adding `.env` to `.gitignore` does not untrack files already committed. You must explicitly `git rm --cached <file>` to stop tracking without deleting the local file.
- **Services must never import Mongoose models directly**: All DB access goes through repositories. If a service imports a model, it bypasses the abstraction and re-introduces tight coupling. Services should import from `repositories/`, only importing type interfaces (like `IMoodLog`) from `models/`.
- **Docker frontend port differs from dev**: `npm run dev` serves client at `localhost:5173`, but the Docker compose maps frontend to `localhost:3000` (nginx on port 80 → host port 3000).
- **MongoMemoryServer binary caching on CI**: First run downloads ~100MB MongoDB binary. CI caches `~/.cache/mongodb-binaries` to avoid re-downloading on every pipeline run.

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
2. In Docker compose, the nginx config proxies `/api/` requests to `http://backend:5000/api/` — so if `VITE_API_BASE_URL` is not set, the client falls back to `"/api/v1"` and the proxy handles it.
3. For direct browser-to-backend calls: the URL must be `http://localhost:5000/api/v1` for local Docker, or the production backend URL.
4. This value is baked in at build time. Changing `.env` requires rebuilding the client image.

### Scenario: Tests fail with "MongoMemoryServer" timeout
**Likely cause**: First run downloads the MongoDB binary (~100MB). Check:
1. Internet connectivity during test run.
2. Increase `testTimeout` in `jest.config.ts` if needed (currently 30s).
3. On CI, cache `~/.cache/mongodb-binaries` between runs to avoid re-download.

### Scenario: CD pipeline fails on AWS authentication
**Likely cause**: OIDC role misconfiguration. Check:
1. GitHub secrets `AWS_ROLE_ARN_ECR` (backend) and `AWS_ROLE_ARN_S3` (frontend) point to valid IAM roles.
2. The IAM roles have trust policies allowing `token.actions.githubusercontent.com` as a federated identity provider.
3. The roles have the correct permissions (ECR push for backend, S3 sync + CloudFront invalidation for frontend).
4. `AWS_REGION` secret matches the region where resources are provisioned.
