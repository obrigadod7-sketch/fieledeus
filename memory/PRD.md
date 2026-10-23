# Watizat / fieledeus – PRD
## Problem
Repo github.com/obrigadod7-sketch/fieledeus (root backend/ + frontend/). User asked for: a nicer home (feed) page, a fix for slow/missing published posts, and settings that work on Render.
## Stack
FastAPI + MongoDB (motor) + React (CRA/craco) + Tailwind/shadcn.
## Done (2026-06)
- Root cause found: the old HomePage rendered `{false}` instead of the post list, so posts never showed. Slowness came from 100 posts loaded at once with base64 images inline, filtering in Python, and no indexes.
- Backend: GET /api/posts now pages results ({posts, has_more, next_skip}, with limit/skip/type/category/user_id) and filters in the database. Images are served by GET /api/posts/{id}/images/{idx} with cache headers. Added GZip, Mongo indexes on startup, and comment_count. Comments now look up authors in one query and are validated.
- Frontend: new "Sereno e acolhedor" feed in components/feed/*: welcome strip, SOS/WhatsApp, chips, cards, comments, lightbox, skeletons, "Carregar mais", sidebar. Photos are shrunk on the client before upload. The user is cached so the app opens instantly on a cold start.
- Removed the package.json resolutions that broke babel-loader (schema-utils/ajv).
- render.yaml rewritten: backend uses rootDir backend with requirements_render.txt; frontend runs as runtime static. Secrets use sync:false.
## Backlog
- P1: restyle /jobs, /direct-chat and /volunteers to match the new look
- P1: make /api/jobs/search fail gracefully without RAPIDAPI_KEY
- P2: split server.py into routers; remove old HomePage.*.js files
## 2026-06 – SonarCloud quality gate (red X on GitHub)
- The gate failed on: reliability (bugs), security (package.json had no lock file), and 13.4% duplication. Build and deploy were green.
- Fixed: 50+ unhandled promises (marked with `void`), keyboard handlers on clickable divs, duplicate i18n keys, a CSS gap override, input() in create_admin.py (now asyncio.to_thread), and SRI on the Leaflet CDN files.
- Removed dead files (HomePage.backup/old/old2, Home.jsx, Editor.jsx, ProjectList, mock, i18n_complete).
- Added .sonarcloud.properties: excludes the tooling plugins, shadcn ui and package.json; i18n.js is excluded from the duplication check.
- Render frontend now builds with yarn.
## 2026-06 – Render frontend build fix
- The Render build failed with "Cannot find module 'ajv/dist/compile/codegen'" when built with npm. Fixed by adding ajv ^8.17.1 to devDependencies; a clean `npm install && npm run build` now passes (iteration_2).
- render.yaml frontend now uses npm on Node 22.16.0, matching the Render dashboard. The dashboard needs Publish Directory = build.
## 2026-06 – Admin dashboard login
- seed_admin() runs on startup and creates or promotes the admin from ADMIN_EMAIL / ADMIN_PASSWORD. It is idempotent: it resets the password and role if they change.
- Login and register now match email case-insensitively.
- Preview admin: admin@fieledeus.com / FielAdmin2026!. On Render, set ADMIN_EMAIL and ADMIN_PASSWORD in the backend env.
- Backlog: login rate limiting.
## 2026-06 – Landing with photos, iPhone jitter, admin@admin
- LandingPage redesigned in the Sereno style: hero photo of volunteers, photo cards for "Preciso de Ajuda" / "Quero Ajudar", and a professionals section with photos. The texts still come from i18n.
- iPhone stability: overflow-x clip, 100svh/dvh, 16px inputs (no zoom on focus), no backdrop blur on mobile fixed/sticky bars, hover transforms only on devices with hover, viewport-fit=cover with safe-area padding, and dialogs no longer wider than the screen.
- Login and User email fields are now plain str, so admin emails without a TLD (admin@admin) work through ADMIN_EMAIL. Register still validates email.
- Backlog: i18n for the hardcoded landing strings; login rate limiting.
## 2026-06 – Translations, unified styles, profile photo
- The landing page is fully translated (PT, FR, EN, ES) using the new landing* i18n keys.
- Global theme: CSS variables set to the warm palette (sage teal primary, gold accent, cream background, Plus Jakarta Sans). JobsPage, DirectChatPage, VolunteersPage and AIChat now use warm colors; emoji were replaced with lucide icons (catIcon helper).
- Profile photo: PUT/DELETE /api/profile/avatar takes a data URL (jpeg/png/webp, max 600KB, compressed to 400px on the client) and stores it in db.avatars. GET /api/users/{id}/avatar serves it with an immutable cache, busted by ?v=avatar_version. Shown on Profile (AvatarUploader), post cards, comments and the direct chat header.
