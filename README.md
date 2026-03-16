# MoodMate

A full-stack mood tracking application that helps users log, monitor, and understand their emotional well-being over time. Built with React, Express, TypeScript, and MongoDB.

## Features

- **Mood Logging** — Record daily moods with intensity, energy levels, sleep data, tags (people, places, events), notes, and reflections
- **Dashboard** — Aggregated mood statistics with averages and mood-type breakdowns over configurable time windows
- **Mood History** — Browse and filter past mood logs with pagination
- **Authentication** — JWT-based auth with role support (user, admin, therapist), rate-limited login/register
- **Data-Driven Routing** — JSON-configured routes with role-based access control and code-split lazy loading
- **API Documentation** — Swagger UI available at `/api-docs` in development

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS 3, shadcn/ui, React Hook Form, Zod, Axios, Framer Motion |
| **Backend** | Node.js 20, Express, TypeScript, Mongoose, MongoDB, JWT, Zod, Pino logger |
| **Testing** | Jest, Supertest, mongodb-memory-server |
| **Code Quality** | ESLint, Prettier, Husky, lint-staged |
| **Infrastructure** | Docker, nginx, GitHub Actions CI/CD, AWS (ECR, EC2, S3, CloudFront) |

## Project Structure

```
moodmate/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── api/             # Axios instance with interceptors
│   │   ├── auth/            # ProtectedRoute, role-based access
│   │   ├── components/      # UI primitives (shadcn/ui) + layout
│   │   ├── context/         # AuthContext (React Context + localStorage)
│   │   ├── pages/           # Page components (auth, dashboard, mood, profile)
│   │   ├── routes/          # Data-driven routing (JSON config + lazy loading)
│   │   ├── services/        # API call wrappers
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile           # Multi-stage: Node build → nginx serve
│   └── nginx.conf           # SPA fallback + API proxy
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── config/          # Env validation, DB connection, JWT, Swagger
│   │   ├── controllers/     # Thin request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access (generic BaseRepository + extensions)
│   │   ├── models/          # Mongoose schemas (User, MoodLog)
│   │   ├── middlewares/     # Auth, error handling, rate limiting, request ID
│   │   ├── validations/     # Zod schemas
│   │   ├── utils/           # Logger, custom errors, async handler
│   │   ├── seeds/           # Development data seeder
│   │   └── __tests__/       # Integration + unit tests
│   └── Dockerfile           # Multi-stage: TS compile → Node alpine runtime
│
├── docker-compose.yml       # Development stack (build from source)
├── docker-compose.prod.yml  # Production stack (pre-built images from ECR)
└── .github/workflows/       # CI (lint + test + build) + CD (ECR/EC2 + S3/CloudFront)
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local instance or Docker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nidhin-mohan/moodmate.git
   cd moodmate
   ```

2. **Set up the server**
   ```bash
   cd server
   cp .env.example .env    # Edit .env with your values
   npm install
   npm run dev              # Runs at http://localhost:5000
   ```

3. **Set up the client** (in a new terminal)
   ```bash
   cd client
   cp .env.example .env    # Default API URL is http://localhost:5000/api/v1
   npm install
   npm run dev              # Runs at http://localhost:5173
   ```

### Docker (Full Stack)

```bash
# Create server/.env with MONGO_URI=mongodb://mongo:27017/moodmate
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- MongoDB data persists in the `mongo_data` volume

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/moodmate` |
| `JWT_SECRET` | JWT signing secret (min 16 chars) | `your-secret-key-here` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173` |

### Client (`client/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api/v1` |

> **Note:** Vite env vars are baked into the bundle at build time. Changing `VITE_API_BASE_URL` requires a rebuild.

## API Endpoints

Base path: `/api/v1/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check (DB state + uptime) |
| POST | `/api/v1/auth/register` | No | Register a new user |
| POST | `/api/v1/auth/login` | No | Login, returns JWT |
| GET | `/api/v1/auth/profile` | JWT | Get current user profile |
| POST | `/api/v1/mood` | JWT | Create a mood log |
| GET | `/api/v1/mood` | JWT | List mood logs (paginated, filterable) |
| GET | `/api/v1/mood/stats` | JWT | Aggregated mood statistics |
| GET | `/api/v1/mood/:id` | JWT | Get a single mood log |
| PUT | `/api/v1/mood/:id` | JWT | Update a mood log |
| DELETE | `/api/v1/mood/:id` | JWT | Delete a mood log |

Swagger docs available at `GET /api-docs` in development.

## Architecture

### Backend — Layered Pattern

```
Routes → Controllers → Services → Repositories → MongoDB
```

- **Controllers** — Parse requests, validate with Zod, delegate to services
- **Services** — Business logic, enforce ownership on mood queries
- **Repositories** — Generic `BaseRepository<T>` with CRUD; `UserRepository` and `MoodLogRepository` extend it with collection-specific queries
- **Error handling** — Custom error classes (`BadRequestError`, `UnauthorizedError`, `NotFoundError`, `ConflictError`) with a central error handler middleware

### Frontend — Data-Driven Routing

Routes are declared in `routes.json`, mapped to lazy-loaded components via `componentMap.ts`, and rendered with role-based access control. Adding a new page requires two changes: one entry in `routes.json` and one in `componentMap.ts`.

### CI/CD Pipeline

- **CI** — On push/PR to `main`: lint, test, and build both client and server
- **CD Backend** — On push to `main` (server changes): build Docker image → push to AWS ECR → deploy to EC2
- **CD Frontend** — On push to `main` (client changes): build with Vite → sync to S3 → invalidate CloudFront cache

## Scripts

### Server

```bash
npm run dev            # Development server with hot reload
npm run build          # Compile TypeScript to dist/
npm start              # Run production build
npm test               # Run all tests
npm run test:coverage  # Tests with coverage report (thresholds enforced)
npm run lint           # Check for lint issues
npm run format         # Auto-format with Prettier
npm run seed <userId>  # Seed 60 days of mood data for a user
```

### Client

```bash
npm run dev            # Vite dev server with HMR
npm run build          # Type-check + production build
npm run lint           # Check for lint issues
npm run preview        # Preview production build locally
```

## Testing

Server tests use **mongodb-memory-server** for isolated in-memory MongoDB — no external database needed.

```bash
cd server
npm test               # Run all tests
npm run test:coverage  # Run with coverage (50% branches, 60% functions/lines/statements)
npx jest src/__tests__/auth.test.ts   # Run a single test file
```

Test suites:
- `auth.test.ts` — Authentication integration tests (register, login, profile)
- `mood.test.ts` — Mood log CRUD integration tests
- `validation.test.ts` — Zod schema unit tests

## License

MIT
