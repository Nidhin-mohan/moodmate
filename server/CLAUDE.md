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
```

## Architecture Notes

Express + TypeScript + Mongoose + MongoDB. Layered pattern:

**Routes → Controllers → Services**
- Controllers are thin: parse request, validate with Zod, call service, send response. No try/catch — errors bubble to `asyncHandler` → `errorHandler`.
- Services contain all business logic and DB queries. Every mood query includes `{ user: userId }` to enforce ownership at the data layer.
- Zod validation schemas live in `src/validations/`. Validated in controllers before calling services.

### Key Directories

- `src/config/` — env validation (`env.ts` with Zod, fails fast with per-field errors), DB connection (`db.ts`), JWT generation (`jwt.ts`, 7-day expiry)
- `src/routes/` — route definitions (`authRoutes.ts`, `moodLogRoutes.ts`)
- `src/controllers/` — thin request handlers
- `src/services/` — business logic layer
- `src/models/` — Mongoose schemas (`User`, `MoodLog`)
- `src/middlewares/` — auth (`authMiddleware.ts`), error handling (`errorMiddleware.ts`)
- `src/validations/` — Zod schemas for request validation
- `src/utils/` — `asyncHandler` (wraps async routes + structured logging per handler), `customError` (base class + 4 subclasses), `logger` (color-coded console with timestamps)
- `src/constants/` — HTTP status codes and messages enum
- `src/@types/` — Express type augmentation (`req.user`)
- `src/seeds/` — seed script for development data

### Middleware Stack Order

`helmet` → `cors` → `express.json (16kb limit)` → `morgan` → routes → `notFound` → `errorHandler`

### Startup & Shutdown

`index.ts` connects to DB first, then starts HTTP server. Registers `SIGTERM`/`SIGINT` handlers that:
1. Stop accepting new connections (`server.close`)
2. Close Mongoose connection
3. Exit cleanly — or force-exit after 10 seconds if graceful shutdown stalls

### API Routes

Base path: `/api/v1/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | DB health check (returns connection state + uptime) |
| POST | `/api/v1/auth/register` | No (rate-limited) | Register |
| POST | `/api/v1/auth/login` | No (rate-limited) | Login, returns JWT |
| GET | `/api/v1/auth/profile` | JWT | Get own profile |
| POST | `/api/v1/mood` | JWT | Create mood log |
| GET | `/api/v1/mood` | JWT | List logs (paginated, filterable by date range and mood) |
| GET | `/api/v1/mood/stats` | JWT | Aggregated stats (two parallel aggregation pipelines) |
| GET | `/api/v1/mood/:id` | JWT | Get single log |
| PUT | `/api/v1/mood/:id` | JWT | Update log |
| DELETE | `/api/v1/mood/:id` | JWT | Delete log |

### Auth

Stateless JWT — Bearer token in `Authorization` header, 7-day expiry. `authMiddleware.ts` verifies token, fetches user from DB (excluding password via `.select("-password")`), and attaches to `req.user`. Three distinct failure paths: missing/malformed header, valid token but deleted user, invalid/expired token.

Auth routes rate-limited to 20 req/15min per IP via `express-rate-limit`.

### Models

- **User**: `{ name, email, password, role }` — bcrypt pre-save hook (salt rounds 10, guarded by `isModified("password")` to prevent double-hashing), `matchPassword()` instance method. Three roles: `admin`, `user`, `therapist`.
- **MoodLog**: `{ user, mood, specificEmotion, intensity (1-10), energyLevel (1-10), tagsPeople[], tagsPlaces[], tagsEvents[], sleepHours (0-24), sleepQuality (1-5), exercise, notes, reflections, aiAnalysis, date }` — compound index `{user:1, date:-1}` for performant per-user time-ordered queries. `aiAnalysis` field exists for future AI integration.

### Error Handling

Custom error classes extend `CustomError` in `utils/customError.ts`:
- `BadRequestError` (400, `BAD_REQUEST`)
- `UnauthorizedError` (401, `UNAUTHORIZED`)
- `NotFoundError` (404, `NOT_FOUND`) — accepts resource name and optional ID
- `ConflictError` (409, `CONFLICT`)

Central `errorHandler` middleware handles `ZodError` specially (returns field-level validation errors). Stack traces included in non-production responses, stripped in production. Each error carries a machine-readable `errorCode` for programmatic client handling.

### Stats Aggregation

`getMoodStatsService` runs two parallel MongoDB aggregation pipelines via `Promise.all`:
1. Numeric averages: intensity, energy level, sleep hours, sleep quality, total count
2. Mood breakdown: count per mood type (returns `Record<string, number>`)

Both are scoped to user + configurable day window (default 30 days).

## Testing

Uses **mongodb-memory-server** — no external DB required.

- `__tests__/env-setup.ts` — injects test env vars before module loading (Jest `setupFiles`). Critical so `config/env.ts` gets valid test vars without a real `.env` file.
- `__tests__/setup.ts` — MongoMemoryServer lifecycle. `afterEach` drops all collections for test isolation. `afterAll` shuts down in-memory server.
- `__tests__/helpers.ts` — shared supertest `request`, `createAuthenticatedUser()`, `validMoodLog` fixture
- `auth.test.ts` / `mood.test.ts` — integration tests (HTTP via supertest against the real Express app)
- `validation.test.ts` — unit tests for Zod schemas (pure validation, no DB/HTTP)
- Jest config: 30-second timeout for slow in-memory DB startup, `silent: true` suppresses console noise

## Environment Variables (`.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/moodmate
JWT_SECRET=<min 16 chars, enforced by Zod>
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
```

All validated at startup via `config/env.ts`. App prints exact failing fields and exits with code 1 on misconfiguration.

## Path Alias

`@/` maps to `./src/` via `tsconfig-paths`.

## Deployment Steps

### Local Development
1. Install MongoDB locally or use `docker-compose up mongo` from repo root
2. Create `.env` from `.env.example`
3. `npm install && npm run dev`
4. Server runs at `http://localhost:5000`

### Docker
1. Set `MONGO_URI=mongodb://mongo:27017/moodmate` in `.env` (use Docker service name `mongo`, not `localhost`)
2. `docker-compose up --build` from repo root
3. Multi-stage Dockerfile: stage 1 compiles TypeScript, stage 2 is a lean `node:20-alpine` image with only `dist/`, `node_modules/`, and `package.json`

### Production
- Set `NODE_ENV=production` to strip stack traces from error responses
- Set `CORS_ORIGINS` to the production frontend domain(s), comma-separated
- `JWT_SECRET` must be a strong random string (min 16 chars)
- The health check at `GET /health` reports DB connection state and uptime — use for load balancer health probes

## Tradeoff Explanations

- **Separate tag arrays vs single tags array**: `tagsPeople`, `tagsPlaces`, `tagsEvents` are three separate arrays rather than a flat `tags[]` with type discriminators. This makes aggregation queries simpler (no nested filtering) at the cost of a more rigid schema. Adding a new tag category requires a schema migration.
- **Zod validation in controllers vs middleware**: Validation happens inside controller functions rather than in dedicated middleware. This keeps validation close to the handler that uses the data and allows controller-specific validation logic, but means Zod parse calls are repeated in each controller.
- **asyncHandler wrapping vs express-async-errors**: Manual wrapping with `asyncHandler` is more explicit and adds structured logging per handler (task name). The tradeoff is boilerplate — every controller must use it.
- **User lookup on every authenticated request**: `authMiddleware` does a DB query (`User.findById`) on every request to verify the user still exists. This catches deleted users immediately but adds a DB round-trip per request. A cache or token-only approach would be faster but risks stale user state.
- **No update/delete exposed in frontend**: The server has full CRUD, but the frontend only uses create and read. Immutable mood logs preserve the full history for pattern analysis. The endpoints exist for admin tooling or future features.

## Lessons Learned

- **Route ordering matters**: `/mood/stats` must be declared before `/mood/:id` in the router. Otherwise Express matches `"stats"` as an `:id` parameter and the stats endpoint becomes unreachable, returning a 404 or a cast error.
- **Pre-save hook `isModified` guard**: The User model's bcrypt pre-save hook must check `this.isModified("password")`. Without this, updating any user field (name, role) would re-hash the already-hashed password, corrupting it.
- **`env-setup.ts` must run in `setupFiles`, not `setupFilesAfterEnv`**: Test environment variables must be injected before any module imports. `config/env.ts` validates at import time — if test vars aren't set by then, the validation fails and tests crash before they start.
- **Mongoose `select("-password")` in auth middleware**: Forgetting this leaks password hashes into `req.user`, which could propagate to API responses if the user object is serialized carelessly.

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
4. Check if the user was deleted from DB (auth middleware does `User.findById`)

### Mood creation returns 400
1. Check Zod validation errors in the response `errors` array — each entry has `field` and `message`
2. Common issues: `intensity` or `energyLevel` outside 1-10, `sleepQuality` outside 1-5, missing required `mood` field
3. Tag fields must be `string[]`, not comma-separated strings

### Stats endpoint returns empty data
1. Check the `days` query parameter — defaults to 30. If all logs are older, the aggregation finds nothing.
2. Verify the user has mood logs (empty `moodBreakdown` and zero `totalLogs` means no matching data)
3. Check that the date filter uses `$gte` correctly — the start date is calculated server-side as `now - days`

### Tests fail with MongoMemoryServer timeout
1. First run downloads the MongoDB binary (~100MB). Needs internet.
2. Increase `testTimeout` in `jest.config.ts` if needed (currently 30s)
3. On CI, cache `~/.cache/mongodb-binaries` between runs to avoid re-download
4. Check that no other process is using the dynamically allocated port
