# MoodMate — Backend

RESTful API server for mood tracking, built with Express, TypeScript, Mongoose, and MongoDB. Follows a layered architecture pattern with a generic repository for data access.

## Tech Stack

- **Express** — Web framework
- **TypeScript** — Type safety
- **Mongoose** + **MongoDB** — ODM and database
- **JWT** + **bcrypt** — Stateless authentication with password hashing
- **Zod** — Request validation and environment variable validation
- **Pino** — Structured JSON logging with request ID tracing
- **Jest** + **Supertest** + **mongodb-memory-server** — Testing with in-memory DB
- **Swagger** — OpenAPI 3.0 documentation
- **ESLint** + **Prettier** + **Husky** — Code quality and formatting

## Getting Started

```bash
cp .env.example .env     # Configure your environment variables
npm install
npm run dev              # http://localhost:5000
```

Swagger docs available at `http://localhost:5000/api-docs` in development.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build (`node dist/index.js`) |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Tests with coverage report (thresholds enforced) |
| `npm run lint` | Check for lint issues |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format all source files with Prettier |
| `npm run format:check` | Check formatting (CI-friendly) |
| `npm run seed <userId>` | Seed 60 days of mood data for a user |

## Project Structure

```
src/
├── config/
│   ├── db.ts                 # MongoDB connection
│   ├── env.ts                # Zod-based env validation (fails fast on bad config)
│   ├── jwt.ts                # JWT token generation (7-day expiry)
│   └── swagger.ts            # OpenAPI 3.0 spec
├── controllers/
│   ├── authController.ts     # Register, login, profile
│   └── moodLogController.ts  # CRUD + stats
├── services/
│   ├── authService.ts        # Auth business logic
│   └── moodLogService.ts     # Mood log business logic
├── repositories/
│   ├── baseRepository.ts     # Generic CRUD (findAll, findById, create, update, delete)
│   ├── userRepository.ts     # Extends base: findByEmail, findByIdSecure
│   ├── moodLogRepository.ts  # Extends base: ownership-scoped queries, aggregation stats
│   └── types.ts              # QueryOptions, PaginatedResult, AggregatedStats
├── models/
│   ├── userModel.ts          # User schema (bcrypt pre-save hook, roles: admin/user/therapist)
│   └── moodLogModel.ts       # MoodLog schema (compound index {user:1, date:-1})
├── middlewares/
│   ├── authMiddleware.ts     # JWT verification, attaches req.user
│   ├── errorMiddleware.ts    # Central error handler (Zod-aware, strips stack in prod)
│   ├── rateLimiter.ts        # 20 req/15min on auth routes
│   ├── requestId.ts          # UUID per request (x-request-id header)
│   └── validateObjectId.ts   # Clean 400 for invalid MongoDB ObjectIds
├── validations/
│   ├── userValidation.ts     # Register/login Zod schemas
│   └── moodLogValidation.ts  # Mood log create/update Zod schemas
├── routes/
│   ├── authRoutes.ts
│   └── moodLogRoutes.ts
├── utils/
│   ├── asyncHandler.ts       # Async route wrapper with structured logging
│   ├── customError.ts        # BadRequest, Unauthorized, NotFound, Conflict errors
│   └── logger.ts             # Pino logger (JSON prod, pretty dev, silent test)
├── constants/
│   └── httpStatusCodes.ts    # HTTP status codes enum
├── seeds/
│   └── moodSeed.ts           # Development data seeder
├── @types/
│   └── express.d.ts          # Express type augmentation (req.user)
├── app.ts                    # Express app setup + middleware stack
├── index.ts                  # Server startup + graceful shutdown
└── __tests__/
    ├── env-setup.ts           # Injects test env vars (Jest setupFiles)
    ├── setup.ts               # MongoMemoryServer lifecycle
    ├── helpers.ts             # Shared test utilities + fixtures
    ├── auth.test.ts           # Auth integration tests
    ├── mood.test.ts           # Mood log integration tests
    └── validation.test.ts     # Zod schema unit tests
```

## Architecture

### Layered Pattern

```
Routes → Controllers → Services → Repositories → MongoDB
```

- **Controllers** are thin — parse request, validate with Zod, call service, send response. No try/catch; errors bubble through `asyncHandler` to the central error handler.
- **Services** contain business logic. They call repository methods, never Mongoose models directly. All mood queries include `{ user: userId }` to enforce ownership.
- **Repositories** are the only layer that touches the database. `BaseRepository<T>` provides generic CRUD for every collection. `UserRepository` and `MoodLogRepository` extend it with collection-specific queries.

### Middleware Stack

Request flows through middleware in this order:

```
requestId → helmet → cors → express.json (16kb) → morgan → routes → notFound → errorHandler
```

### Startup & Shutdown

1. Connects to MongoDB first, then starts the HTTP server
2. Registers `SIGTERM`/`SIGINT` handlers for graceful shutdown
3. Closes HTTP server and Mongoose connection, with a 10-second force-exit safety net

## API Endpoints

Base path: `/api/v1/`

### Auth Routes (rate-limited: 20 req/15min per IP)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register a new user |
| POST | `/api/v1/auth/login` | No | Login, returns JWT token |
| GET | `/api/v1/auth/profile` | JWT | Get current user profile |

### Mood Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/mood` | JWT | Create a mood log |
| GET | `/api/v1/mood` | JWT | List logs (paginated, filterable by date range and mood) |
| GET | `/api/v1/mood/stats?days=30` | JWT | Aggregated stats (averages + mood breakdown) |
| GET | `/api/v1/mood/:id` | JWT | Get a single mood log |
| PUT | `/api/v1/mood/:id` | JWT | Update a mood log |
| DELETE | `/api/v1/mood/:id` | JWT | Delete a mood log |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | DB connection state + uptime |

## Data Models

### User

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Required, unique |
| `password` | String | Hashed with bcrypt (salt rounds: 10) |
| `role` | String | `admin`, `user`, or `therapist` |

- Pre-save hook hashes password only when modified (`isModified` guard prevents double-hashing)
- `matchPassword()` instance method for login comparison

### MoodLog

| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId | Ref to User |
| `mood` | String | Required |
| `specificEmotion` | String | Optional |
| `intensity` | Number | 1–10 |
| `energyLevel` | Number | 1–10 |
| `tagsPeople` | String[] | People tags |
| `tagsPlaces` | String[] | Place tags |
| `tagsEvents` | String[] | Event tags |
| `sleepHours` | Number | 0–24 |
| `sleepQuality` | Number | 1–5 |
| `exercise` | Boolean | Whether user exercised |
| `notes` | String | Optional |
| `reflections` | String | Optional |
| `aiAnalysis` | String | Reserved for future AI integration |
| `date` | Date | Log date |

- Compound index `{user: 1, date: -1}` for fast per-user time-ordered queries

## Error Handling

Custom error classes extend `CustomError`:

| Class | Status | Use Case |
|-------|--------|----------|
| `BadRequestError` | 400 | Invalid input |
| `UnauthorizedError` | 401 | Missing/invalid auth |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Duplicate resource |

- `ZodError` gets special handling — returns field-level validation details
- Stack traces included in development, stripped in production
- Every error response includes `requestId` for log correlation

## Authentication

- Stateless JWT with Bearer token in `Authorization` header
- 7-day token expiry
- Auth middleware verifies token, fetches user from DB (excluding password), attaches to `req.user`
- Three failure paths: missing/malformed header, valid token but deleted user, invalid/expired token

## Testing

Tests use **mongodb-memory-server** — no external database required.

```bash
npm test                              # Run all tests
npm run test:coverage                 # With coverage report
npx jest src/__tests__/auth.test.ts   # Run a single file
```

### Test Infrastructure

- `env-setup.ts` — Injects test env vars before any module loads (runs in Jest `setupFiles`)
- `setup.ts` — MongoMemoryServer lifecycle; `afterEach` drops all collections for isolation
- `helpers.ts` — Shared supertest request, `createAuthenticatedUser()`, `validMoodLog` fixture

### Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Branches | 50% |
| Functions | 60% |
| Lines | 60% |
| Statements | 60% |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/moodmate` |
| `JWT_SECRET` | JWT signing secret (min 16 chars, enforced by Zod) | `your-secret-key-here` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `CORS_ORIGINS` | Allowed origins, comma-separated | `http://localhost:5173` |

All variables are validated at startup via Zod. The app fails fast with field-level error messages if any are missing or invalid.

## Linting & Formatting

- **ESLint** — Flat config with TypeScript rules + Prettier integration
- **Prettier** — Single quotes, trailing commas, 100-char line width, 2-space indent
- **Pre-commit hooks** — Husky + lint-staged auto-format and lint-fix staged `.ts` files

```bash
npm run lint         # Check
npm run lint:fix     # Auto-fix
npm run format       # Format all files
npm run format:check # Check formatting (CI)
```

## Deployment

### Docker

```bash
# From repo root, set MONGO_URI=mongodb://mongo:27017/moodmate in server/.env
docker-compose up --build
```

Multi-stage Dockerfile: stage 1 compiles TypeScript, stage 2 is a lean `node:20-alpine` image with only `dist/`, production `node_modules/`, and `package.json`.

### Production (AWS ECR + EC2)

The GitHub Actions CD pipeline:
1. Builds the Docker image
2. Pushes to AWS ECR (tagged with commit SHA + `latest`)
3. SSHs into EC2 and deploys via `docker-compose.prod.yml`

### Production Checklist

- Set `NODE_ENV=production` (strips stack traces from error responses)
- Set `CORS_ORIGINS` to production frontend domain(s)
- Use a strong random `JWT_SECRET` (min 16 chars)
- Use `GET /health` for load balancer health probes

## Path Alias

`@/` maps to `./src/` via `tsconfig-paths`.
