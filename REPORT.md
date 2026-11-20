# Infrastructures Project Report

## 1. Introduction

This project implements **Traveller's Blog**, a content-driven web application composed of two separate applications:

- a **Strapi 5 backend**, responsible for content management, roles, permissions and media;
- an **Astro frontend**, responsible for generating and presenting the public website.

The main infrastructure objectives were to make the project reproducible, containerise the backend, validate changes through CI workflows, publish the backend image to GitHub Container Registry, and deploy the static frontend through Cloudflare.

The final solution prioritises reliable local execution because this is the primary evaluation scenario. A hosted frontend is also provided as an additional demonstration of deployment and CI/CD knowledge.

---

## 2. Technology decisions

### 2.1 SQLite

I decided to use **SQLite** as the database for the complete project.

Other supported options, such as PostgreSQL and MySQL, would provide better concurrency, scalability and support for multiple backend instances. However, Traveller's Blog is an academic project with a small expected number of users and a single Strapi instance. Its data model and traffic do not justify operating a separate database server.

SQLite provides the following advantages in this context:

- simple local setup;
- no separate database container or service;
- easy backup through a single database file;
- sufficient performance for the expected workload;
- straightforward integration with Strapi and Docker volumes.


### 2.2 TypeScript

Strapi and Astro were configured with **TypeScript** instead of JavaScript.

TypeScript improves development reliability by validating data structures, component properties and API response types before runtime. This is particularly useful when consuming Strapi entities such as articles, authors, tags, gallery images and media formats.

TypeScript does not prevent all errors, but it reduces mistakes such as incorrect property names, incompatible values and unexpected null values.

### 2.3 Astro and Tailwind CSS

The frontend uses **Astro** because the website is mainly content-based and can be generated as static HTML. Static generation reduces the amount of JavaScript delivered to visitors and allows Cloudflare to serve previously generated pages without requiring the Strapi backend for every page request.

**Tailwind CSS** is integrated through the recommended Vite plugin. Tailwind is used for utility styling where appropriate, while some Astro components also contain scoped CSS for page-specific layouts and animations.

### 2.4 GitHub Container Registry

I chose **GitHub Container Registry (GHCR)** to store backend Docker images.

This choice keeps the source repository, GitHub Actions workflows and container image under the same GitHub project. GHCR is suitable for this project's scale and avoids introducing an additional registry account in Azure, AWS or Docker Hub.

---

## 3. Backend implementation

### 3.1 Internationalisation

English was configured as the default frontend locale, with Portuguese as an additional locale. The Strapi content types are localized and support both languages.

Internationalisation was enabled at the beginning because enabling it later would require revisiting existing content types, entries, slugs and frontend routes. The Astro frontend provides Portuguese and English routes and requests the corresponding Strapi locale.

The current frontend is designed to display available content even when a translation is incomplete. This avoids hiding valid entries, although a future improvement would prioritise a translated version and explicitly identify fallback content.

### 3.2 Content types

The Strapi content types are:

- **Tag**;
- **Author**;
- **Article**;
- **Gallery Image**.

I decided to use collection types because the application needs to store multiple entries for articles, authors, tags, and gallery images. Single types are intended for content that only has one entry, while components are used as reusable field structures inside content types.

The content types contain a mixture of common fields, media fields and relations. For example, a tag contains a name and slug and has many-to-many relations with articles and gallery images.

An article includes fields such as title, slug, summary, rich-text block content, cover image, additional media, tags and author. A gallery image includes its image, title, slug, description, location, tags and author.

Relations were designed so that:

- one author can be related to several articles;
- one author can be related to several gallery images;
- one article can contain several tags;
- one tag can belong to several articles;
- one gallery image can contain several tags;
- one tag can belong to several gallery images.

Author relations are required for articles and gallery images, ensuring that published content has a visible contributor.

### 3.3 REST API and public permissions

The API was tested through endpoints such as:

```text
http://localhost:1337/api/articles
http://localhost:1337/api/gallery-images
http://localhost:1337/api/authors
http://localhost:1337/api/tags
```

The public role only receives the read permissions required by the website:

- `find`, to retrieve a collection;
- `findOne`, to retrieve an individual document.

Public `create`, `update` and `delete` permissions remain disabled. Content creation is performed through the authenticated Strapi administration panel rather than through the public Astro website.

### 3.4 Administrative roles

The project defines specific administration-panel roles rather than relying only on Strapi's generic default roles:

- **Writer**, responsible for article content;
- **Traveller**, responsible for gallery contributions;
- **Moderator**, responsible for reviewing and managing content;
- **Administrator/Super Admin**, responsible for the complete CMS configuration.


The permissions follow the principle of least privilege. Contributors only receive the permissions required for their responsibilities, while moderation and system configuration remain restricted.

The roles were tested by inviting separate administrative users and verifying which content types and actions were available to each account.

### 3.5 Rich-text blocks

Since Astro does not provide a native renderer for Strapi’s JSON-based Rich Text Blocks format, I implemented a custom renderer that converts each block into the corresponding semantic HTML element.

This approach keeps the frontend centred on Astro and provides full control over the generated markup. The renderer supports all block types required by the current content and can be extended to support additional types in the future.


### 3.6 Known editorial limitation

The administration user and the public `Author` content type are separate concepts in Strapi. Consequently, assigning an article to an author is an editorial action and Strapi does not automatically guarantee that an administration user selects the corresponding public author profile.

For the current project, author selection is required and enforced at content level. A future improvement could map administration users to author profiles programmatically and restrict contributor choices automatically.

---

## 4. Frontend implementation

### 4.1 Shared page structure

The Astro frontend begins with shared layout and common components:

- `BaseLayout.astro` defines the common HTML structure and metadata;
- the header provides navigation and language selection;
- the footer provides shared project information and links.

The public website contains:

- a home page;
- an article listing;
- article detail pages generated from slugs;
- a gallery;
- a contributors page.

### 4.2 Article and gallery pages

Article cards provide a summary of each article and link to its complete detail page. Individual article routes use the article slug and display the title, summary, author, publication date, tags, rich-text content, and associated media.

The gallery initially displays a limited set of gallery images published through Strapi. A "Filter by" control exposes the available tags and allows exactly one tag to be selected; selecting a tag reloads the grid with only matching images. Additional images are requested by selecting the "Load more" button. When an image is selected, a modal opens with an enlarged view and its associated metadata, including the title, description, location, author, and tags.

The header underlines the navigation item corresponding to the current page. Portuguese and English routes retain the active underline in the matching page menu.

The footer is implemented as a separate Astro component and contains component-scoped styles. Its social links provide a visible hover and keyboard-focus state.

### 4.3 Internationalised frontend routes

The frontend supports both Portuguese and English. Interface elements are translated locally, while content retrieved from Strapi is requested using the locale selected by the user.

Since translations are not generated automatically, each Strapi entry must be created separately in Portuguese and English. When a translation is unavailable, the frontend uses the content available in the other locale as a fallback. This required implementing logic that first requests content in the selected language and then retrieves the alternative locale when no corresponding translation exists.


### 4.4 Static media

Initially, generated pages contained image URLs pointing directly to Strapi. This meant that the pages remained available when Strapi was stopped, but gallery and article images no longer loaded.

To remove this runtime dependency, the frontend now synchronises Strapi uploads before each Astro build.

The script:

```text
frontend/scripts/syncStrapiMedia.mjs
```

copies:

```text
backend/public/uploads/
```

into:

```text
frontend/public/uploads/
```

The frontend build command is:

```json
"build": "npm run sync-media && astro build"
```

Astro then copies those files to:

```text
frontend/dist/uploads/
```

Media URL handling converts Strapi URLs into local static paths such as:

```text
/uploads/example-image.avif
```

As a result, Cloudflare serves the generated pages and media directly. After a successful build, the existing static pages and local images remain available when Strapi is offline. Loading additional gallery pages requires the public `STRAPI_URL` used by the deployed frontend to remain reachable.

---

## 5. Docker implementation

### 5.1 Dockerfile

The backend uses a multi-stage Dockerfile.

Both Docker stages use Node.js 24. The build stage installs dependencies and builds the Strapi administration panel. The production stage contains the required runtime files and launches Strapi with `npm run start`. The GitHub Actions workflows also use Node.js 24.

The final container runs as the `node` user rather than as root. Files such as local environment files, local dependencies, temporary database files and uploads are excluded from the Docker build context where appropriate.

### 5.2 Development Compose file

The standard `docker-compose.yml` is used for local development and testing. It builds the current backend source code locally and provides a shorter, reproducible command:

```bash
docker compose up -d --build
```

This is clearer and less error-prone than maintaining a long `docker run` command with ports, environment files and mounts.

### 5.3 Production Compose file

The project also contains `docker-compose.production.yml`.

The two-file approach separates two different intentions:

- `docker-compose.yml` builds the current local source and supports development;
- `docker-compose.production.yml` pulls the already tested image from GHCR and simulates how a production server would run the backend.

The production-like configuration includes a restart policy and uses a separate `backend.env` file.

### 5.4 Persistence and bind mounts

The production-like Compose file mounts:

```yaml
volumes:
  - ./backend/.tmp:/opt/app/data
  - ./backend/public/uploads:/opt/app/public/uploads
```

The mapping exposes the host's SQLite database as:

```text
/opt/app/data/data.db
```

inside the container. Uploaded files are similarly mounted at Strapi's uploads path.

This separation is necessary because a container filesystem is disposable. Recreating a container must not delete articles, users, roles, permissions or uploaded media.

The prepared `data.db` and demonstration uploads are included with the submission so that the evaluator receives the configured content, roles and media. The Docker image itself remains independent of runtime data.

---

## 6. CI/CD

### 6.1 Backend CI

The backend GitHub Actions workflow validates the Strapi project and produces the deployable image.

For relevant pushes to `main`, the workflow:

1. checks out the repository;
2. installs backend dependencies with `npm ci`;
3. runs the Strapi build;
4. builds the Docker image from `backend/Dockerfile`;
5. publishes the image to GHCR.

Pull requests validate the backend and Docker build without publishing a production image.

The resulting image can be tested locally with:

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

### 6.2 Frontend CI

The frontend build depends on Strapi data at build time. Depending on an externally running Quick Tunnel made CI unreliable because the Tunnel could be offline or its URL could change.

The Frontend CI workflow was therefore made self-contained. It:

1. installs backend dependencies;
2. starts a temporary Strapi instance inside the GitHub runner;
3. installs frontend dependencies;
4. builds Astro using the runner's local Strapi address;
5. uploads `frontend/dist` as a workflow artifact.

This validates the real Strapi-to-Astro integration without depending on my computer or a Tunnel.

The Frontend CI workflow validates the code. Cloudflare's Git integration performs the public frontend build and deployment.

### 6.3 Meaning of CI/CD without a permanent backend host

CI/CD remains valuable even though the backend is not permanently hosted:

- every backend change is validated in a clean environment;
- every frontend change is validated against a temporary Strapi instance;
- the backend image is versioned and distributed through GHCR;
- the production-like backend can be started locally from the published image;
- frontend pushes can be deployed automatically by Cloudflare.

Content updates in Strapi are database changes, not source-code changes. They do not require a new backend image. Because the Astro frontend is static, content alterations require a new frontend build before they appear on the hosted site.

---

## 7. Cloudflare deployment

The Astro frontend is connected to Cloudflare through Git integration.

Cloudflare requires a public `STRAPI_URL` during build time because its build runner cannot reach `localhost:1337` on my computer.

For the current academic deployment, a Cloudflare Quick Tunnel temporarily exposes the local Strapi backend:

```bash
cloudflared tunnel --url http://localhost:1337
```

The current Tunnel URL is configured as the Cloudflare `STRAPI_URL` build variable. Docker and `cloudflared` remain active only until the remote build completes.

After a successful build, Cloudflare hosts:

- the generated HTML pages;
- CSS and frontend JavaScript;
- the copied Strapi media under `/uploads/`.

The existing generated pages and static media remain available when the local backend and Tunnel are stopped. Loading additional gallery pages, however, is a runtime operation that requires Strapi to remain reachable while the user requests them.

A Quick Tunnel URL changes when recreated. Before a later Cloudflare build, the variable must therefore be updated to the current URL. A permanent hosted backend or Named Tunnel would remove this manual step, but permanent backend hosting was treated as an optional extension rather than the primary evaluation requirement.

---

## 8. Local and hosted evaluation

The primary requirement is that the complete project works locally after cloning.

The evaluator can run:

```bash
docker compose up -d --build
```

and, in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

This provides:

```text
Strapi: http://localhost:1337/admin
Astro:  http://localhost:4321
```

The Cloudflare deployment demonstrates the additional ability to host the static frontend. The backend is also packaged and published in GHCR, but a permanent public Linux-server deployment was not required or tested.

---

## 9. Challenges and resolutions

### 9.1 Runtime media dependency

**Problem:** Static HTML was deployed successfully, but images still pointed to the temporary Strapi Tunnel and disappeared when the Tunnel stopped.

**Resolution:** A pre-build media synchronisation script copies uploads into Astro's public directory, and media URLs are converted to `/uploads/...` paths.

### 9.2 Frontend CI depended on an external backend

**Problem:** The frontend workflow failed whenever the temporary Strapi Tunnel was unavailable or outdated.

**Resolution:** The workflow now starts its own Strapi process in the GitHub runner and builds against `http://127.0.0.1:1337`.

### 9.3 SQLite persistence in Docker

**Problem:** Starting the production-like image with a new empty volume caused Strapi to request a new administrator and lose access to the prepared local content.

**Resolution:** Bind mounts map the prepared host database and uploads into the container while keeping them outside the Docker image.

### 9.4 Quick Tunnel URLs change

**Problem:** A new Quick Tunnel receives a different hostname, making an earlier Cloudflare `STRAPI_URL` invalid.

**Resolution:** The Cloudflare variable is updated before starting a new remote build. The generated frontend no longer depends on that hostname after the build because media is copied into the static output.

---

## 10. Limitations and future improvements

The current project has the following known limitations:


- Minor visual inconsistencies that should be fixed;
- Articles pages do not yet include a "Load more" button, as implemented on the gallery page;
- the public hosted frontend requires a temporarily reachable Strapi API whenever a new remote build is needed;
- gallery pagination requests the public Strapi API when a user loads additional images;
- automatic Strapi-to-Cloudflare rebuild through a webhook has not yet been configured;
- translated detail pages require safer fallback handling when a corresponding translated slug does not exist;
- administration users are not automatically mapped to public Author profiles;
- additional rich-text block types may require future renderer updates;


Potential future work includes:

- deploying Strapi to a Linux server or managed container platform;
- replacing the Quick Tunnel with a stable backend address;
- configuring a Strapi webhook and Cloudflare Deploy Hook;
- moving media to Cloudflare R2, Amazon S3 or Cloudinary;
- migrating SQLite to PostgreSQL if the workload or concurrency requirements increase;
- improving translated content fallbacks and language-switching behaviour;
- creating an explicit mapping between administrative users and Author profiles;
- implementing a search bar on articles and gallery pages;
- allowing the user to check the details on each contributor (similar to gallery images).


---

## 11. Conclusion

The project meets its principal infrastructure goals:

- a functional Strapi CMS with roles, permissions, localisation and structured content;
- an Astro frontend that statically generates multilingual pages;
- Docker-based backend execution with persistent SQLite data and uploads;
- separate development and production-like Compose configurations;
- automated backend and frontend validation through GitHub Actions;
- backend image publication through GHCR;
- static frontend deployment through Cloudflare;
- media included in the static frontend build so that the deployed website remains complete when Strapi is offline.

The final implementation prioritises reproducible local execution while also demonstrating containerisation, image distribution, automated validation and static cloud deployment.
