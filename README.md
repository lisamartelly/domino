# Domino

A full-stack social matching app with a React frontend and NestJS/TypeScript backend, backed by PostgreSQL.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma 7
- **Database:** PostgreSQL 18
- **Task Runner:** [go-task](https://taskfile.dev/)

## Prerequisites

### Node.js 24

Install via [nvm](https://github.com/nvm-sh/nvm) (recommended):

```bash
nvm install 24
nvm use 24
```

Or download directly from [nodejs.org](https://nodejs.org/).

### Docker

Required for running the PostgreSQL database container.

Install from [docker.com](https://www.docker.com/get-started/).

### go-task

**macOS (Homebrew):**

```bash
brew install go-task
```

**Other methods:** See the [official installation guide](https://taskfile.dev/installation/).

## Getting Started

### Quick Start

Start the entire development environment with hot reload:

```bash
task watch
```

This will:
1. Start the PostgreSQL database container
2. Launch the NestJS backend with hot reload
3. Start the React frontend dev server

### Start Without Hot Reload

```bash
task start
```

## Available Tasks

| Task | Description |
|------|-------------|
| `task watch` | Start full dev environment with hot reload |
| `task start` | Start full dev environment without hot reload |
| `task dev` | Start database, backend, frontend, and DB logs |
| `task up-db` | Start PostgreSQL container only |
| `task api` | Run NestJS backend only |
| `task client` | Run React frontend only |
| `task api-test` | Run backend tests |
| `task api-test-watch` | Run backend tests in watch mode |
| `task client-test` | Run frontend tests |
| `task client-test-watch` | Run frontend tests in watch mode |
| `task test` | Run backend and frontend tests |
| `task api-lint` | Check backend code for lint errors |
| `task client-lint` | Check frontend code for lint errors |
| `task client-lint-fix` | Auto-fix frontend lint errors |
| `task lint` | Lint backend and frontend |
| `task db-logs` | Tail PostgreSQL container logs |
| `task migrate:up` | Apply all pending database migrations |
| `task migrate:down` | Roll back the last applied migration |
| `task migrate:status` | Show which migrations have been applied |

View all available tasks:

```bash
task --list
```

## Project Structure

```
domino/
├── backend-ts/                   # NestJS backend
│   ├── src/                      # Application source
│   ├── prisma/                   # Prisma schema & migrations
│   └── scripts/                  # Migration & seed scripts
├── frontend/                     # React + Vite application
│   ├── src/
│   └── package.json
├── docker-compose.yml            # PostgreSQL container config
├── Taskfile.yml                  # Task runner configuration
└── README.md
```

## Development

### Backend API

The NestJS backend runs on `http://localhost:5297` by default.

### Frontend

The React frontend runs on `http://localhost:5173` (Vite dev server).

### Database

PostgreSQL runs in Docker:

- **Host:** `localhost`
- **Port:** `5433`
- **Database:** `domino`
- **User:** `user`
- **Password:** `password`

### Migrations

Database migrations are managed with custom scripts wrapping Prisma.

```bash
task migrate:up       # Apply pending migrations
task migrate:down     # Roll back the last migration
task migrate:status   # Show migration status
```

## Testing

### Backend

```bash
cd backend-ts
npm test
```

### Frontend

```bash
cd frontend
npm test            # Watch mode
npm run test:run    # Run once
npm run test:coverage
```

### Linting

```bash
task lint           # Lint both projects
task client-lint-fix  # Auto-fix frontend
```
