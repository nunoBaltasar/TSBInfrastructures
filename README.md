# Traveller's Blog

Traveller's Blog is composed of:

- `backend/`: Strapi 5 CMS and REST API, using SQLite;
- `frontend/`: static Astro website that consumes content from Strapi.

This README explains how to run the project in development, how to test it locally in production mode, and how the current deployment process works.

## Prerequisites

### Without Docker

To run the applications directly, install:

- Node.js 24 LTS;
- npm;
- Git.

### With Docker

To run the backend in a container, install:

- Docker Desktop on Windows or macOS, or Docker Engine on Linux;
- Docker Compose v2.

Docker provides the Linux and Node.js environment inside the backend container. Node.js and npm are still required on the host machine when running the frontend locally or running either application without Docker.

For the temporary public backend used by Cloudflare builds, also install `cloudflared`.

## Environment files

### Backend development environment

Create `backend/.env` from the supplied example.

Linux or macOS:

```bash
cp backend/.env.example backend/.env
```

Windows PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Replace every placeholder secret in `backend/.env` with a real value. A random Base64 value can be generated in, for example, powershell with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate four different values for `APP_KEYS`, separated by a comma, and one value for each remaining Strapi secret.

For local development, the relevant database configuration is:

```dotenv
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Frontend development environment

Create `frontend/.env`:

Linux or macOS:

```bash
cp frontend/.env.example frontend/.env
```

Windows PowerShell:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

Use the local Strapi URL:

```dotenv
STRAPI_URL=http://127.0.0.1:1337
```

Do not add `/api` to `STRAPI_URL` because the frontend API helper already adds it.

### Production-like backend environment

The production Compose file reads a separate file named `backend.env` from the repository root. Create it from the backend example and adapt it:

```dotenv
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

DATABASE_CLIENT=sqlite
DATABASE_FILENAME=/opt/app/data/data.db

APP_KEYS=<key-1>,<key-2>,<key-3>,<key-4>
API_TOKEN_SALT=<secret>
ADMIN_JWT_SECRET=<secret>
TRANSFER_TOKEN_SALT=<secret>
JWT_SECRET=<secret>
ENCRYPTION_KEY=<secret>

```
Use the same secrets from `backend/.env`.


## 1. Run in development mode

Development mode is intended for changing application code, content types and styles. Run the backend and frontend in separate terminals.

### Backend

```bash
cd backend
npm ci
npm run develop
```

Available addresses:

```text
Admin panel: http://localhost:1337/admin
REST API:    http://localhost:1337/api
```

Use `npm run develop` when changing Strapi schemas, controllers, services, routes, plugins or other backend code. Strapi reloads when source files change.

### Frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

The Astro development server normally runs at:

```text
http://localhost:4321
```

The backend must be running because the frontend obtains its content from the Strapi API.

Do not run the native Strapi development server and the Docker backend at the same time. Both use port `1337` and may try to use the same SQLite file.

## 2. Run locally in production mode

This validates the applications using their production build commands without deploying them publicly.

### Backend without Docker

```bash
cd backend
npm ci
npm run build
npm run start
```

The Strapi backend runs at `http://localhost:1337`.

### Frontend

Keep the backend running. In another terminal:

```bash
cd frontend
npm ci
npm run build
npm run preview
```

Astro generates the static website in `frontend/dist/` and normally previews it at `http://localhost:4321`.

The backend must be available while `npm run build` runs because Astro requests the Strapi content when generating the static pages.

## 3. Run the backend with Docker

### Build the current local backend code

From the repository root:

```bash
docker compose up -d --build
```

Check the service:

```bash
docker compose ps
docker compose logs -f backend
```

Stop it with:

```bash
docker compose down
```

This mode builds the image locally from `backend/Dockerfile`.

### Run the image published in GHCR

The backend CI workflow publishes the tested image to GitHub Container Registry. To run that image locally, first create `backend.env`, then execute:

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

Check it with:

```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f backend
```

Stop it with:

```bash
docker compose -f docker-compose.production.yml down
```

The production-like Compose file currently uses these bind mounts:

```yaml
volumes:
  - ./backend/.tmp:/opt/app/data
  - ./backend/public/uploads:/opt/app/public/uploads
```

Therefore:

- `backend/.tmp/data.db` is seen inside the container as `/opt/app/data/data.db`;
- `backend/public/uploads/` is seen as `/opt/app/public/uploads/`.

The existing SQLite database and uploaded media are included in the repository. Docker Compose bind-mounts these files into the container, allowing Strapi to use the prepared content, users, roles, permissions and media. Because the data is stored on the host rather than inside the container, it remains available when the container is stopped, removed or recreated.
After cloning the repository and creating the required environment files, the evaluator can start the backend with the prepared database and content. A new administrator registration is only requested if backend/.tmp/data.db is missing, empty or mounted at an incorrect path.

## 4. CI/CD behaviour

### Backend CI

The workflow is defined in `.github/workflows/backend-ci.yml`.

A push to `main` that matches the workflow triggers automatically:

1. dependency installation;
2. Strapi build validation;
3. Docker image build;
4. publication of the image to GitHub Container Registry.

The published image is then consumed by `docker-compose.production.yml`.

After backend code is pushed and the workflow succeeds, update a running production-like container with:

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### Frontend CI

The workflow is defined in `.github/workflows/frontend-ci.yml`.

A push to `main` that matches the workflow triggers automatically. It:

1. installs frontend dependencies;
2. runs `npm run build`;
3. stores `frontend/dist` as a workflow artifact.

This workflow validates the frontend but does not publish the public website. The connected Cloudflare project performs the actual frontend build and deployment.


### Types of changes

#### Frontend code change

```text
Change frontend code
→ commit and push to main
→ Frontend CI validates automatically
→ Cloudflare detects the push
→ Cloudflare builds and publishes the frontend
```

#### Backend code change

Backend code includes Strapi source code, schemas, content-type definitions, routes, controllers, services, plugins, dependencies and the Dockerfile.

```text
Change backend code
→ commit and push to main
→ Backend CI validates automatically
→ a new Docker image is published to GHCR
→ pull and restart the production-like container
```

#### Strapi content or database setting change

Articles, gallery entries, authors, tags, administrative users, roles and permissions are stored in SQLite. These changes do not create a Git commit and do not require a new Docker image.

At the current stage of the project, a content change only appears on the deployed static frontend after a new Cloudflare build is started. Automatic Strapi-to-Cloudflare rebuilds are not yet configured.

## 5. Cloudflare Deployment
The frontend is currently deployed through Cloudflare Workers and Pages and is available at:

https://tsbinfrastructures.baltasarcnpt.workers.dev

The Cloudflare project is managed through the project owner's Cloudflare account. Therefore, only the project owner can update its environment variables or manually manage its deployments.

The following section explains how the deployed frontend can currently be updated using the locally running Strapi backend.

To include updated Strapi content in a new Cloudflare build, the local backend must temporarily be made publicly accessible.
start with:

First, start the backend from the repository root:
```bash
docker compose -f docker-compose.production.yml up -d
```

In another terminal, start a Cloudflare Quick Tunnel:

```bash
cloudflared tunnel --url http://localhost:1337
```

Cloudflare returns a temporary public address similar to:

```text
https://example-name.trycloudflare.com
```


The Docker backend and the terminal running cloudflared must remain active while GitHub Actions or Cloudflare builds the frontend.

A Quick Tunnel normally receives a different URL whenever it is restarted. When this happens, update STRAPI_URL in
the Cloudflare project settings, under Variables and Secrets.

After changing STRAPI_URL, a new Cloudflare build is required because the previously generated static pages retain the old backend and media URLs.

If frontend code has changed, commit and push the changes to main. Cloudflare will automatically detect the push and start a new build.

If only Strapi content has changed, such as an article, gallery image, author or tag, no Git commit is required. Until an automatic webhook is configured, a new Cloudflare build must be started manually.

Keep the backend and Tunnel running until the Cloudflare deployment finishes. After the build is complete, the static pages remain available. 

## 6. Deploy the backend to a Linux server

A permanent Linux-server deployment was not performed as part of the current project demonstration. The backend was validated locally through its Linux-based Docker image and exposed temporarily through Cloudflare Tunnel.

The repository nevertheless includes `docker-compose.production.yml`, which is prepared to run the backend image published in GHCR. On a Linux server, the expected process is:

```bash
docker login ghcr.io
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```
This procedure is documented as the intended production deployment, but it has not been validated on a permanent public Linux server.

