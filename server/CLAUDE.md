# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this server directory.

## Commands

```bash
npm run dev          # ts-node-dev with live reload (--respawn --transpile-only)
npm run debug        # ts-node-dev with --inspect (Node debugger)
npm run build        # tsc → compiles to dist/
npm start            # node dist/index.js (production)
npm test             # jest (all __tests__/*.test.ts)
npm run test:watch   # jest --watch
npx jest src/__tests__/auth.test.ts   # run a single test file
npm run lint         # eslint — check for lint issues
npm run lint:fix     # eslint — auto-fix issues
npm run format       # prettier — format all src/**/*.ts files
npm run format:check # prettier — check formatting (CI-friendly)
npm run test:coverage # jest with coverage report + thresholds
npm run seed <userId> # seed 60 days of mood logs for a user
```

## Architecture Notes

Express + TypeScript + Mongoose + MongoDB. Layered pattern:

**Routes → Controllers → Services → Repositories**
- Controllers are thin: parse request, validate with Zod, call service, send response. No try/catch — errors bubble to `asyncHandler` → `errorHandler`.
- Services contain all business logic. They call repository methods — never Mongoose models directly. Every mood query includes `{ user: userId }` to enforce ownership at the data layer.
- Repositories are the only layer that touches the database. A generic `BaseRepository<T>` provides CRUD (findAll, findById, create, updateById, deleteById, exists) for every collection. Collection-specific repos extend it and add only custom queries. Repositories export singleton instances (`export const userRepository = new UserRepository()`).
- Zod validation schemas live in `src/validations/`. Validated in controllers before calling services.

### Key Directories

- `src/config/` — env validation (`env.ts` with Zod, fails fast with per-field errors, PORT defaults to 5000), DB connection (`db.ts`), JWT generation (`jwt.ts`, 7-day expiry), Swagger/OpenAPI spec (`swagger.ts`)
- `src/routes/` — route definitions (`authRoutes.ts`, `moodLogRoutes.ts`)
- `src/controllers/` — thin request handlers
- `src/services/` — business logic layer (no direct DB imports)
- `src/repositories/` — data access layer: `baseRepository.ts` (generic CRUD), `userRepository.ts`, `moodLogRepository.ts`, `types.ts` (shared `QueryOptions`, `PaginatedResult`)
- `src/models/` — Mongoose schemas (`User`, `MoodLog`) + `index.ts` barrel export
- `src/middlewares/` — auth (`authMiddleware.ts`), error handling (`errorMiddleware.ts`), rate limiting (`rateLimiter.ts`), request ID (`requestId.ts`), ObjectId validation (`validateObjectId.ts`)
- `src/validations/` — Zod schemas for request validation
- `src/utils/` — `asyncHandler` (wraps async routes + creates child Pino logger with `{ task, requestId }`, logs "started"/"completed"/"failed" per handler), `customError` (base `CustomError` class + 5 subclasses with `statusCode` and `errorCode`), `logger` (Pino structured logger — JSON in production, pretty-printed in dev, silent in test)
- `src/constants/` — `httpStatusCodes.ts` exports `HTTP_STATUS` enum and `MESSAGES` map used throughout controllers and error classes
- `src/@types/` — Express type augmentation (`req.user`)
- `src/seeds/` — seed script for development data

### Middleware Stack Order

`requestId` → `helmet` → `cors` → `express.json (16kb limit)` → `morgan` → routes → `notFound` → `errorHandler`

### Startup & Shutdown

`index.ts` connects to DB first, then starts HTTP server. Registers `SIGTERM`/`SIGINT` handlers that:
1. Stop accepting new connections (`server.close`)
2. Close Mongoose connection
3. Exit cleanly — or force-exit after 10 seconds if graceful shutdown stalls

### API Routes

Base path: `/api/v1/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No (rate-limited: 10 req/min) | DB health check (returns `{ success, status, db, uptime }`, 200 if healthy, 503 if unhealthy) |
| POST | `/api/v1/auth/register` | No (rate-limited: 20 req/15min) | Register |
| POST | `/api/v1/auth/login` | No (rate-limited: 20 req/15min) | Login, returns JWT |
| GET | `/api/v1/auth/profile` | JWT | Get own profile |
| POST | `/api/v1/mood` | JWT | Create mood log |
| GET | `/api/v1/mood` | JWT | List logs (Zod-validated query: `page` ≥1, `limit` 1–100, `startDate`/`endDate` dates, `mood` string) |
| GET | `/api/v1/mood/stats` | JWT | Aggregated stats (`days` 1–365, default 30; two parallel aggregation pipelines) |
| GET | `/api/v1/mood/:id` | JWT | Get single log |
| PUT | `/api/v1/mood/:id` | JWT | Update log |
| DELETE | `/api/v1/mood/:id` | JWT | Delete log |
| GET | `/api/v1/admin/users` | JWT + admin | List users (search is literal, ≤100 chars; `isPro=false` means "not true") |
| PATCH | `/api/v1/admin/users/:id` | JWT + admin | Update role / isPro / name |
| DELETE | `/api/v1/admin/users/:id` | JWT + admin | Soft-delete |

Query strings are validated with Zod in the controller like bodies are — never `parseInt(req.query.x)`. Invalid input is a 400 with field-level errors, and operator objects (`mood[$ne]=x`) never reach MongoDB. Mood `date` may not be more than one day in the future.

### Auth

Stateless JWT — Bearer token in `Authorization` header, 7-day expiry. `authMiddleware.ts` verifies token, fetches the user via `userRepository.findByIdSecure()` (excludes password and soft-deleted users), and attaches to `req.user`. Three distinct failure paths: missing/malformed header, valid token but user missing or soft-deleted, invalid/expired token. Login uses `findActiveByEmail`, so a soft-deleted user gets the same "Invalid email or password" as a wrong password. Emails are trimmed and lower-cased (Zod schemas + model), so they're case-insensitive.

### Admin rules

`requireAdmin` answers a logged-in non-admin with **403** (`ForbiddenError`), not 401, so the client doesn't log them out. `admin.service.ts` enforces: no changing your own role, no deleting yourself, and never removing the last active admin (`countActiveAdmins`). Services take `AdminAction { actorId, targetId }`; ids are compared case-insensitively. Soft-deleted users are excluded everywhere via `ACTIVE_USER_FILTER`.

### Rate Limiting

Two rate limiters in `middlewares/rateLimiter.ts`:
- **`authLimiter`**: 20 requests per 15 minutes per IP — applied to auth routes (`/api/v1/auth/`)
- **`healthLimiter`**: 10 requests per 1 minute per IP — applied to `GET /health`

### Models

- **User**: `{ name, email, password, role }` — bcrypt pre-save hook (salt rounds 10, guarded by `isModified("password")` to prevent double-hashing), `matchPassword()` instance method. Three roles: `admin`, `user`, `therapist`.
- **MoodLog**: `{ user, mood, specificEmotion, intensity (1-10), energyLevel (1-10), stressLevel, anxietyLevel, tagsPeople[], tagsPlaces[], tagsEvents[], socialQuality, moodTriggerCategory, sleepHours (0-24), sleepQuality (1-5), exercise, exerciseMinutes, notes, reflections, aiAnalysis, date }` — compound index `{user:1, date:-1}` for performant per-user time-ordered queries. **Only `mood` is required**: a quick log stores just the mood, and every other field is present only if the user reported it (no defaults invented; `exercise` has no default so "not recorded" ≠ "didn't exercise"; tag arrays default to `[]`). Every reader must treat non-mood fields as possibly missing. `aiAnalysis` is never written today (the weekly AI analysis is emailed, not stored).

### Error Handling

Custom error classes extend `CustomError` in `utils/customError.ts`:
- `BadRequestError` (400, `BAD_REQUEST`)
- `UnauthorizedError` (401, `UNAUTHORIZED`) — not authenticated
- `ForbiddenError` (403, `FORBIDDEN`) — authenticated but not allowed
- `NotFoundError` (404, `NOT_FOUND`) — accepts resource name and optional ID
- `ConflictError` (409, `CONFLICT`)

Central `errorHandler` middleware handles `ZodError` specially (returns field-level validation errors). Stack traces included in non-production responses, stripped in production. Each error carries a machine-readable `errorCode` for programmatic client handling. All error responses include `requestId` for log correlation.

### Repository Layer

Generic `BaseRepository<TDocument>` in `repositories/baseRepository.ts` provides:
- `findAll(options)` — filter + sort + pagination + select + total count in one call via `QueryOptions<TFilter>`
- `findById(id)`, `findOne(filter)`, `create(data)`, `updateById(id, data)`, `deleteById(id)`, `exists(filter)`

Collection-specific repositories extend the base:
- **UserRepository** — adds `findByEmail(email)` (any account, so deleted users' emails stay taken), `findActiveByEmail(email)` (login), `findByIdSecure(id)` (active, excludes password), `findWeeklyAnalysisRecipients()` (active Pro users), `countActiveAdmins({ excludingId })`. Exports `ACTIVE_USER_FILTER`, the single definition of "not soft-deleted".
- **MoodLogRepository** — adds `findByUserAndId()`, `updateByUserAndId()`, `deleteByUserAndId()` (ownership-scoped), `getStatsByUser()` (aggregation pipelines)

Shared types in `repositories/types.ts`: `QueryOptions<TFilter>`, `PaginatedResult<T>`, `AggregatedStats`.

To add a new collection (e.g., Message): create model, then `class MessageRepository extends BaseRepository<IMessage>` — gets full CRUD for free, only add custom queries.

### Stats Aggregation

`MoodLogRepository.getStatsByUser()` runs two parallel MongoDB aggregation pipelines via `Promise.all`:
1. Numeric averages: intensity, energy level, sleep hours, sleep quality, total count
2. Mood breakdown: count per mood type (returns `Record<string, number>`)

Both are scoped to user + configurable day window (default 30 days), bounded above by now so future-dated legacy logs don't count. The service (`getMoodStatsService`) calls the repository method and formats the result: each average is a number rounded to one decimal, or `null` when no log in the window recorded that field (`$avg` skips missing fields) — never `0` for "no data".

The weekly AI analysis uses `computeWeeklyStats()` (`services/weeklyStats.ts`), which applies the same rule; the prompt and the email template print only metrics that were recorded.

## Testing

Uses **mongodb-memory-server** — no external DB required.

- `__tests__/env-setup.ts` — injects test env vars before module loading (Jest `setupFiles`). Critical so `config/env.ts` gets valid test vars without a real `.env` file.
- `__tests__/setup.ts` — MongoMemoryServer lifecycle. `afterEach` drops all collections for test isolation. `afterAll` shuts down in-memory server.
- `__tests__/helpers.ts` — shared supertest `request`, `createAuthenticatedUser()`, `createAdminUser()`, `makeAdmin()`, `validMoodLog` fixture. `createAuthenticatedUser()` inserts the user and signs the token directly instead of calling `/auth/register`: the auth rate limiter (20 req/15 min) would otherwise 429 files that need many users. Each test file gets a fresh app and limiter, so put tests that hit auth endpoints heavily in their own file.
- `auth.test.ts`, `emailCase.test.ts`, `mood.test.ts`, `moodQuery.test.ts`, `admin.test.ts` — integration tests (HTTP via supertest against the real Express app)
- `weeklyAnalysisJob.test.ts` — runs `runWeeklyAnalysisJob()` with the AI and email services mocked
- `validation.test.ts` — unit tests for Zod schemas (pure validation, no DB/HTTP)
- Jest config (`jest.config.ts`): `preset: ts-jest`, 30-second timeout for slow in-memory DB startup, `silent: true` suppresses console noise. Coverage excludes `__tests__/`, `@types/`, and `seeds/`.
- **Coverage**: `npm run test:coverage` generates reports in `coverage/` (text + lcov). Thresholds: 50% branches, 60% functions/lines/statements.

## Environment Variables (`.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/moodmate
JWT_SECRET=<min 16 chars, enforced by Zod>
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

All validated at startup via `config/env.ts` (Zod). App prints exact failing fields and exits with code 1 on misconfiguration. PORT defaults to 5000 if not set.

## TypeScript Configuration

`tsconfig.json`: `target: ES2020`, `module: commonjs`, `strict: true`, `outDir: ./dist`, `rootDir: ./src`, `sourceMap: true`, `esModuleInterop: true`, `skipLibCheck: true`, `forceConsistentCasingInFileNames: true`.

## Linting & Formatting

- **ESLint**: Flat config in `eslint.config.mjs` (ES module format). Uses `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier` (disables rules that conflict with Prettier). Key rules: `@typescript-eslint/no-unused-vars` (warn, ignores `_`-prefixed args), `@typescript-eslint/no-explicit-any` (warn). Ignores `dist/`, `node_modules/`, `coverage/`.
- **Prettier**: Config in `.prettierrc`. `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, `endOfLine: "lf"`, `arrowParens: "always"`, `bracketSpacing: true`. Ignores `dist/`, `node_modules/`, `coverage/` via `.prettierignore`.
- Run `npm run lint` before committing. Run `npm run format` to auto-format all source files.
- **Pre-commit hooks**: Husky + lint-staged configured at repo root (`.husky/pre-commit` runs `cd server && npx lint-staged`). On every commit, staged `.ts` files in `src/` are auto-formatted with Prettier and lint-fixed with ESLint.

## Logging & Observability

- **Structured logging**: Pino (`utils/logger.ts`). JSON output in production, pretty-printed in dev, silent in test. All application logs go through Pino — no raw `console.log`.
- **Request ID tracing**: `requestId` middleware (`middlewares/requestId.ts`) generates a UUID per request (or preserves incoming `x-request-id` header). The ID is attached to response headers and included in error responses and `asyncHandler` log entries. Use `x-request-id` to correlate logs for a single request.
- **Per-handler logging**: `asyncHandler` creates a child Pino logger with `{ task: taskName, requestId }` and logs "started", "completed", and "failed" for each route handler invocation.
- **Error responses** include `requestId` field for traceability.

## API Documentation

Swagger UI available at `GET /api-docs` in non-production environments. Defined in `config/swagger.ts` using `swagger-jsdoc` with inline OpenAPI 3.0 spec. Covers all auth and mood endpoints with request/response schemas.

## Input Validation

- **Zod schemas** validate request bodies in controllers.
- **ObjectId validation**: `validateObjectId()` middleware on all `/:id` routes returns `400 Bad Request` for invalid MongoDB ObjectIds instead of letting Mongoose throw a cast error.

## Path Alias

`@/` maps to `./src/` via `tsconfig-paths`.

## Deployment

### Local Development
1. Install MongoDB locally — there is no MongoDB service in docker-compose
2. Create `.env` from `.env.example`
3. `npm install && npm run dev`
4. Server runs at `http://localhost:5000`

### Docker
1. Set `MONGO_URI` in `.env` pointing to an accessible MongoDB instance (e.g. MongoDB Atlas, or a host-network MongoDB — there is no mongo service in docker-compose)
2. `docker-compose up --build` from repo root
3. Multi-stage Dockerfile: stage 1 compiles TypeScript, stage 2 is a lean `node:24-alpine` image with only `dist/`, production `node_modules/`, and `package.json`
4. Docker health check: `wget --spider http://localhost:5000/health` (interval 30s, timeout 5s, retries 3, start period 10s)

### Production (AWS ECR + EC2)
The GitHub Actions CD pipeline (`cd-backend.yml`):
1. Triggers on push to `main` (paths: `server/**` or `docker-compose.prod.yml`)
2. Authenticates to AWS via OIDC role assumption (`AWS_ROLE_ARN_ECR` secret)
3. Builds Docker image and pushes to ECR (tagged with `{github.sha}` + `latest`)
4. SCPs `docker-compose.prod.yml` to EC2
5. SSHs into EC2 → ECR login → `docker compose -f docker-compose.prod.yml up -d --pull always`

`docker-compose.prod.yml` is backend-only — uses pre-built ECR image (`${ECR_IMAGE:-moodmate-backend:latest}`), loads env from `.env` on the EC2 host. Frontend is deployed separately to S3 + CloudFront.

**Required GitHub secrets**: `AWS_ROLE_ARN_ECR`, `AWS_REGION`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.

### Production Checklist
- Set `NODE_ENV=production` to strip stack traces from error responses
- Set `CORS_ORIGINS` to the production frontend domain(s), comma-separated
- `JWT_SECRET` must be a strong random string (min 16 chars)
- `GET /health` returns `{ success, status, db, uptime }` — use for load balancer health probes (200 if DB connected, 503 if unhealthy)

### CI Pipeline
The GitHub Actions CI pipeline (`ci.yml`) runs on push/PR to `main`:
- `npm ci` → `npm run lint` → `npm test` → `npm run build`
- Caches `~/.npm` and `~/.cache/mongodb-binaries` (avoids re-downloading MongoMemoryServer binary on each run)

## Tradeoff Explanations

- **Separate tag arrays vs single tags array**: `tagsPeople`, `tagsPlaces`, `tagsEvents` are three separate arrays rather than a flat `tags[]` with type discriminators. This makes aggregation queries simpler (no nested filtering) at the cost of a more rigid schema. Adding a new tag category requires a schema migration.
- **Zod validation in controllers vs middleware**: Validation happens inside controller functions rather than in dedicated middleware. This keeps validation close to the handler that uses the data and allows controller-specific validation logic, but means Zod parse calls are repeated in each controller.
- **asyncHandler wrapping vs express-async-errors**: Manual wrapping with `asyncHandler` is more explicit and adds structured logging per handler (task name). The tradeoff is boilerplate — every controller must use it.
- **User lookup on every authenticated request**: `authMiddleware` calls `userRepository.findByIdSecure()` on every request to verify the user still exists. This catches deleted users immediately but adds a DB round-trip per request. A cache or token-only approach would be faster but risks stale user state.
- **No general edit/delete in the frontend**: The server has full CRUD. The frontend creates and reads logs, and uses `PUT` in exactly one place: the "Add details" flow straight after a quick log, which fills only fields that are still empty on the entry it just created. Nothing already saved is changed, so the history stays trustworthy for pattern analysis. This "fill blanks only" rule is enforced on the client; `PUT` itself accepts any field (and zod's partial schema injects no defaults, so omitted fields are never wiped).
- **BaseRepository generic CRUD vs hand-rolled per collection**: Every collection repository extends `BaseRepository` and gets `findAll`, `findById`, `create`, `updateById`, `deleteById`, `exists` for free. Custom queries are added only in collection-specific repos. Tradeoff: the base uses `Record<string, unknown>` and `Partial<TDocument>` for flexibility, which is less type-safe than per-method typed parameters. The typed filter interfaces (`MoodLogFilter`, `UserFilter`) on the service side mitigate this.
- **No MongoDB in docker-compose**: The compose file does not include a MongoDB service. This keeps the setup flexible (local Mongo, Atlas, or host-network instance) but requires users to provide their own `MONGO_URI`.

## Lessons Learned

- **Route ordering matters**: `/mood/stats` must be declared before `/mood/:id` in the router. Otherwise Express matches `"stats"` as an `:id` parameter and the stats endpoint becomes unreachable, returning a 404 or a cast error.
- **Pre-save hook `isModified` guard**: The User model's bcrypt pre-save hook must check `this.isModified("password")`. Without this, updating any user field (name, role) would re-hash the already-hashed password, corrupting it.
- **`env-setup.ts` must run in `setupFiles`, not `setupFilesAfterEnv`**: Test environment variables must be injected before any module imports. `config/env.ts` validates at import time — if test vars aren't set by then, the validation fails and tests crash before they start.
- **Mongoose `select("-password")` in auth middleware**: Forgetting this leaks password hashes into `req.user`, which could propagate to API responses if the user object is serialized carelessly.
- **Services must never import Mongoose models directly**: All DB access goes through repositories. If a service imports a model, it bypasses the abstraction layer and re-introduces tight coupling. Check imports: services should import from `repositories/`, never from `models/` (except for type interfaces like `IMoodLog`).
- **MongoMemoryServer binary caching on CI**: First run downloads ~100MB MongoDB binary. CI workflow caches `~/.cache/mongodb-binaries` to avoid re-downloading on every pipeline run.

## Incident Simulations

### Server won't start — exits immediately
1. Check console output — `config/env.ts` prints exact failing fields before `process.exit(1)`
2. Verify `.env` exists and is properly formatted
3. Confirm `JWT_SECRET` is at least 16 characters
4. Confirm MongoDB is reachable at `MONGO_URI`

### All mood endpoints return 401
1. Check that the client sends `Authorization: Bearer <token>` header (not just `<token>`)
2. Verify `JWT_SECRET` in `.env` hasn't changed since the token was issued
3. Check token expiry (7 days)
4. Check if the user was deleted or soft-deleted (`isDeleted: true`) — auth middleware does `userRepository.findByIdSecure()`, which ignores both
5. If it's only `/api/v1/admin/*`: that's a 403 for non-admins, not a 401 — check the user's `role`

### Mood creation returns 400
1. Check Zod validation errors in the response `errors` array — each entry has `field` and `message`
2. Common issues: `intensity` or `energyLevel` outside 1-10, `sleepQuality` outside 1-5 (all optional, but range-checked when sent), missing required `mood` field
3. Tag fields must be `string[]`, not comma-separated strings

### Stats endpoint returns empty data
1. Check the `days` query parameter — defaults to 30, must be 1–365. If all logs are older (or dated in the future), the aggregation finds nothing.
2. Verify the user has mood logs (empty `moodBreakdown` and zero `totalLogs` means no matching data)
3. Check that the date filter uses `$gte` correctly — the start date is calculated server-side as `now - days`

### Health endpoint returns 503
1. MongoDB connection is down — check `MONGO_URI` and that the database is reachable
2. Response includes `db: "disconnected"` — verify MongoDB is running and accepting connections
3. If Docker: ensure `MONGO_URI` points to an accessible host (not `localhost` if MongoDB is external)

### Tests fail with MongoMemoryServer timeout
1. First run downloads the MongoDB binary (~100MB). Needs internet.
2. Increase `testTimeout` in `jest.config.ts` if needed (currently 30s)
3. On CI, cache `~/.cache/mongodb-binaries` between runs to avoid re-download
4. Check that no other process is using the dynamically allocated port

### CD pipeline fails on AWS authentication
1. Verify `AWS_ROLE_ARN_ECR` GitHub secret points to a valid IAM role
2. The IAM role must have a trust policy allowing `token.actions.githubusercontent.com` as a federated identity provider
3. The role needs permissions: ECR `GetAuthorizationToken`, `BatchCheckLayerAvailability`, `PutImage`, etc.
4. `AWS_REGION` secret must match the region where ECR is provisioned
