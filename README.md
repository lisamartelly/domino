# Domino

A full-stack web application with a React frontend and .NET backend, backed by PostgreSQL.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** .NET 10, ASP.NET Core Web API
- **Database:** PostgreSQL 18
- **Task Runner:** [go-task](https://taskfile.dev/)

## Prerequisites

Before getting started, ensure you have the following installed:

### Node.js 24

Install via [nvm](https://github.com/nvm-sh/nvm) (recommended):

```bash
nvm install 24
nvm use 24
```

Or download directly from [nodejs.org](https://nodejs.org/).

Verify installation:

```bash
node --version  # Should output v24.x.x
```

### .NET 10

Download and install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/10.0).

**macOS (Homebrew):**

```bash
brew install dotnet
```

Verify installation:

```bash
dotnet --version  # Should output 10.x.x
```

### go-task

Install via your preferred method:

**macOS (Homebrew):**

```bash
brew install go-task
```

**Linux (Snap):**

```bash
sudo snap install task --classic
```

**Other methods:** See the [official installation guide](https://taskfile.dev/installation/).

Verify installation:

```bash
task --version
```

### Docker

Required for running the PostgreSQL database container.

Install from [docker.com](https://www.docker.com/get-started/).

## Getting Started

### Quick Start

Start the entire development environment with hot reload:

```bash
task watch
```

This will:
1. Start the PostgreSQL database container
2. Launch the .NET backend with hot reload
3. Start the React frontend dev server
4. Stream PostgreSQL logs

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
| `task api` | Run .NET backend only |
| `task client` | Run React frontend only |
| `task client-test` | Run React frontend tests |
| `task client-test-watch` | Run React frontend tests in watch mode |
| `task db-logs` | Tail PostgreSQL container logs |
| `task api-restore` | Restore .NET dependencies |

View all available tasks:

```bash
task --list
```

## Project Structure

```
domino/
├── backend/
│   ├── src/
│   │   └── Domino.Backend/       # ASP.NET Core Web API
│   │       ├── Health/           # Health check endpoint
│   │       └── Program.cs        # Application entry point
│   └── tests/
│       └── Domino.Backend.Tests/ # Unit tests
├── frontend/                     # React + Vite application
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml            # PostgreSQL container config
├── Taskfile.yml                  # Task runner configuration
└── README.md
```

## Development

### Backend API

The .NET backend runs on `http://localhost:5297` by default.

**Swagger UI:** Available at `/swagger` in development mode.

**Health Check:** `GET /api/health`

### Frontend

The React frontend runs on `http://localhost:5173` by default (Vite dev server).

### Database

PostgreSQL runs in Docker and is accessible at:

- **Host:** `localhost`
- **Port:** `5433`
- **Database:** `domino`
- **User:** `user`
- **Password:** `password`

### Migrations

Database migrations are managed with Entity Framework Core tools.

**Install EF Core tools (one-time setup):**

```bash
dotnet tool install --global dotnet-ef
```

**Common commands** (run from `backend/src/Domino.Backend`):

```bash
# Create a new migration
dotnet ef migrations add <MigrationName>

# Apply pending migrations
dotnet ef database update

# Remove the last migration (if not applied)
dotnet ef migrations remove

# List all migrations
dotnet ef migrations list
```

## Testing

### Backend

```bash
cd backend/tests/Domino.Backend.Tests
dotnet test
```

### Frontend

Run tests in watch mode:

```bash
cd frontend
npm test
```

Run tests once:

```bash
cd frontend
npm run test:run
```

Run tests with coverage:

```bash
cd frontend
npm run test:coverage
```

### Linting

```bash
cd frontend
npm run lint
```
