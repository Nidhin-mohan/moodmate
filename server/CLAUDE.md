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
- `src/utils/` — `asyncHandler` (wraps async routes + creates child Pino logger with `{ task, requestId }`, logs "started"/"completed"/"failed" per handler), `customError` (base `CustomError` class + 4 subclasses with `statusCode` and `errorCode`), `logger` (Pino structured logger — JSON in production, pretty-printed in dev, silent in test)
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
| GET | `/api/v1/mood` | JWT | List logs (paginated, filterable by date range and mood) |
| GET | `/api/v1/mood/stats` | JWT | Aggregated stats (two parallel aggregation pipelines) |
| GET | `/api/v1/mood/:id` | JWT | Get single log |
| PUT | `/api/v1/mood/:id` | JWT | Update log |
| DELETE | `/api/v1/mood/:id` | JWT | Delete log |

### Auth

Stateless JWT — Bearer token in `Authorization` header, 7-day expiry. `authMiddleware.ts` verifies token, fetches user from DB (excluding password via `.select("-password")`), and attaches to `req.user`. Three distinct failure paths: missing/malformed header, valid token but deleted user, invalid/expired token.

### Rate Limiting

Two rate limiters in `middlewares/rateLimiter.ts`:
- **`authLimiter`**: 20 requests per 15 minutes per IP — applied to auth routes (`/api/v1/auth/`)
- **`healthLimiter`**: 10 requests per 1 minute per IP — applied to `GET /health`

### Models

- **User**: `{ name, email, password, role }` — bcrypt pre-save hook (salt rounds 10, guarded by `isModified("password")` to prevent double-hashing), `matchPassword()` instance method. Three roles: `admin`, `user`, `therapist`.
- **MoodLog**: `{ user, mood, specificEmotion, intensity (1-10), energyLevel (1-10), tagsPeople[], tagsPlaces[], tagsEvents[], sleepHours (0-24), sleepQuality (1-5), exercise, notes, reflections, aiAnalysis, date }` — compound index `{user:1, date:-1}` for performant per-user time-ordered queries. `aiAnalysis` field exists for future AI integration.

### Error Handling

Custom error classes extend `CustomError` in `utils/customError.ts`:
- `BadRequestError` (400, `BAD_REQUEST`)
- `UnauthorizedError` (401, `UNAUTHORIZED`)
- `NotFoundError` (404, `NOT_FOUND`) — accepts resource name and optional ID
- `ConflictError` (409, `CONFLICT`)

Central `errorHandler` middleware handles `ZodError` specially (returns field-level validation errors). Stack traces included in non-production responses, stripped in production. Each error carries a machine-readable `errorCode` for programmatic client handling. All error responses include `requestId` for log correlation.

### Repository Layer

Generic `BaseRepository<TDocument>` in `repositories/baseRepository.ts` provides:
- `findAll(options)` — filter + sort + pagination + select + total count in one call via `QueryOptions<TFilter>`
- `findById(id)`, `findOne(filter)`, `create(data)`, `updateById(id, data)`, `deleteById(id)`, `exists(filter)`

Collection-specific repositories extend the base:
- **UserRepository** — adds `findByEmail(email)`, `findByIdSecure(id)` (excludes password)
- **MoodLogRepository** — adds `findByUserAndId()`, `updateByUserAndId()`, `deleteByUserAndId()` (ownership-scoped), `getStatsByUser()` (aggregation pipelines)

Shared types in `repositories/types.ts`: `QueryOptions<TFilter>`, `PaginatedResult<T>`, `AggregatedStats`.

To add a new collection (e.g., Message): create model, then `class MessageRepository extends BaseRepository<IMessage>` — gets full CRUD for free, only add custom queries.

### Stats Aggregation

`MoodLogRepository.getStatsByUser()` runs two parallel MongoDB aggregation pipelines via `Promise.all`:
1. Numeric averages: intensity, energy level, sleep hours, sleep quality, total count
2. Mood breakdown: count per mood type (returns `Record<string, number>`)

Both are scoped to user + configurable day window (default 30 days). The service (`getMoodStatsService`) calls the repository method and formats the result.

## Testing

Uses **mongodb-memory-server** — no external DB required.

- `__tests__/env-setup.ts` — injects test env vars before module loading (Jest `setupFiles`). Critical so `config/env.ts` gets valid test vars without a real `.env` file.
- `__tests__/setup.ts` — MongoMemoryServer lifecycle. `afterEach` drops all collections for test isolation. `afterAll` shuts down in-memory server.
- `__tests__/helpers.ts` — shared supertest `request`, `createAuthenticatedUser()`, `validMoodLog` fixture
- `auth.test.ts` / `mood.test.ts` — integration tests (HTTP via supertest against the real Express app)
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
- **No update/delete exposed in frontend**: The server has full CRUD, but the frontend only uses create and read. Immutable mood logs preserve the full history for pattern analysis. The endpoints exist for admin tooling or future features.
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
4. Check if the user was deleted from DB (auth middleware does `userRepository.findByIdSecure()`)

### Mood creation returns 400
1. Check Zod validation errors in the response `errors` array — each entry has `field` and `message`
2. Common issues: `intensity` or `energyLevel` outside 1-10, `sleepQuality` outside 1-5, missing required `mood` field
3. Tag fields must be `string[]`, not comma-separated strings

### Stats endpoint returns empty data
1. Check the `days` query parameter — defaults to 30. If all logs are older, the aggregation finds nothing.
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
