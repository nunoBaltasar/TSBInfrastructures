# Traveller's Blog

Traveller's Blog is composed of:

- `backend/`: Strapi 5 CMS and REST API, using SQLite;
- `frontend/`: static Astro website that consumes content from Strapi.

This README explains how to run the project in development, how to test it locally in production mode, and how the current deployment process works.

## Prerequisites

### Without Docker

To run the applications directly, install:

- Node.js 22 LTS;
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

Replace every placeholder secret in `backend/.env` with a real value. A random Base64 value can be generated with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate four different values for `APP_KEYS` and one value for each remaining Strapi secret.

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

BACKEND_VERSION=latest
```



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

The existing local SQLite database and uploads remain available after the container is recreated. On a newly cloned repository, these locations are empty, so Strapi starts with a new database and requests the creation of the first administrator account.

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
2. reads `STRAPI_URL` from GitHub Actions secrets;
3. runs `npm run build`;
4. stores `frontend/dist` as a workflow artifact.

This workflow validates the frontend but does not publish the public website. The connected Cloudflare project performs the actual frontend build and deployment.

Use **Run workflow** manually only when the frontend build needs to be tested again without creating another commit, for example after changing the GitHub `STRAPI_URL` secret.

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

## 5. Temporary public backend for Cloudflare builds

The GitHub runner and Cloudflare build servers cannot access `http://localhost:1337` on the developer's computer. A Cloudflare Quick Tunnel temporarily exposes the local Strapi backend.

Start the production-like backend:

```bash
docker compose -f docker-compose.production.yml up -d
```

In another terminal, start the Tunnel:

```bash
cloudflared tunnel --url http://localhost:1337
```

Cloudflare returns an address similar to:

```text
https://example-name.trycloudflare.com
```

Verify the API before starting a remote build:

```text
https://example-name.trycloudflare.com/api/articles?populate=*
```

The `cloudflared` terminal and the Docker backend must remain running while GitHub or Cloudflare builds the frontend.

A Quick Tunnel normally receives a different URL after it is restarted. When this happens, update `STRAPI_URL` in both places:

1. GitHub repository settings, under Actions secrets;
2. Cloudflare project settings, under Variables and Secrets.

A new Cloudflare deployment is then required because the previously generated pages retain the old backend and media URLs.

## 6. Deploy the frontend to Cloudflare

The repository is connected to Cloudflare through its Git integration.

Use the following build configuration:

```text
Production branch: main
Root directory: frontend
Build command: npm run build
Build output: dist
```

Set this Cloudflare build variable:

```text
STRAPI_URL=https://<current-public-backend-address>
```

For the current academic setup, the value is the active Quick Tunnel URL. Do not include `/api` at the end.

The Strapi backend and Tunnel must remain online until the Cloudflare build finishes. Once the deployment is complete, the generated static pages remain online even if Strapi is stopped.

Uploaded media currently remains hosted by Strapi. Consequently, article text and static pages remain available when Strapi is offline, but images under `/uploads/` do not load until the backend becomes available again.

A push to `main` automatically starts a new Cloudflare build when the repository integration is active. Changing only a Cloudflare environment variable does not alter an existing deployment, so another build must be started afterwards.

## 7. Deploy the backend to a Linux server

A permanent Linux-server deployment was not performed as part of the current project demonstration. The backend was validated locally through its Linux-based Docker image and exposed temporarily through Cloudflare Tunnel.

The repository nevertheless includes `docker-compose.production.yml`, which is prepared to run the backend image published in GHCR. On a Linux server, the expected process is:

```bash
docker login ghcr.io
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

The server would also require:

- a private `backend.env` file;
- persistent storage for SQLite and uploads;
- a public address;
- HTTPS, normally through Caddy or Nginx.

This procedure is documented as the intended production deployment, but it has not been validated on a permanent public Linux server.

## 8. Data persistence and new clones

The following paths are excluded from Git:

```text
backend/.tmp/
backend/public/uploads/
```

They contain the SQLite database and locally uploaded media.

A developer cloning the repository receives the application code but not the existing CMS data, administrative accounts or uploads. After starting Strapi, the developer must create the first administrator and add content, or import a separate Strapi data export if one is supplied.

Do not commit `data.db`. SQLite is a binary, environment-specific file that can contain administrative data and cannot be safely merged between contributors.

## 9. Common commands

| Purpose | Command |
| --- | --- |
| Develop backend | `cd backend && npm run develop` |
| Build backend | `cd backend && npm run build` |
| Start backend natively | `cd backend && npm run start` |
| Develop frontend | `cd frontend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Preview frontend build | `cd frontend && npm run preview` |
| Build and start local Docker backend | `docker compose up -d --build` |
| Pull backend from GHCR | `docker compose -f docker-compose.production.yml pull` |
| Start GHCR backend image | `docker compose -f docker-compose.production.yml up -d` |
| View production-like logs | `docker compose -f docker-compose.production.yml logs -f backend` |
| Start temporary public Tunnel | `cloudflared tunnel --url http://localhost:1337` |

## 10. Troubleshooting

### Strapi asks for administrator registration again

Strapi is using a new or empty SQLite database. Confirm that the configured path and bind mount agree:

```dotenv
DATABASE_FILENAME=/opt/app/data/data.db
```

```yaml
- ./backend/.tmp:/opt/app/data
```

### SQLite cannot open the database

Confirm that:

- `backend/.tmp/` exists;
- Docker Desktop can access the project directory;
- the container can write to `/opt/app/data`;
- no native Strapi process is using the same SQLite database.

### Remote frontend build cannot reach Strapi

Confirm that:

- the backend container is running;
- the Quick Tunnel is running;
- the public `/api/articles` address works in a browser;
- `STRAPI_URL` contains the current Tunnel address;
- `STRAPI_URL` does not end with `/api`.

### Images point to an old Tunnel

Update `STRAPI_URL` in Cloudflare and start a new Cloudflare build. Existing static pages keep the media URLs used during their original build.

### New Strapi content does not appear on the deployed frontend

The Astro frontend is static. Start a new Cloudflare build after publishing the content. Automatic rebuilds from Strapi are not yet configured.

## Security

- Never commit `backend/.env`, `frontend/.env` or `backend.env`.
- Never commit the SQLite database or real administrative data.
- Never expose Strapi secrets, API tokens or private deployment URLs.
- Keep the public Strapi API limited to required read operations.
- Use HTTPS and persistent backups for a permanent deployment.
