<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dc85e13a-fced-4f2c-819b-5679a3bf2a00

## Run Locally

**Prerequisites:**  Node.js and a PostgreSQL database


1. Install dependencies:
   `npm install`
2. Configure environment variables (see [.env.example](.env.example)):
   - Set `DATABASE_URL` to your PostgreSQL connection string
     (e.g. `postgresql://postgres:postgres@localhost:5432/impulsionegram`).
   - Set `GEMINI_API_KEY` to your Gemini API key.
   - Optionally set `DATABASE_SSL` to `true`/`false` to override SSL
     (SSL is auto-enabled for non-local hosts).
3. Run the app:
   `npm run dev`

## Database

All persistence (services, plans, orders, users and home content) is stored in
**PostgreSQL** through the [`pg`](https://node-postgres.com/) driver. The schema
is created automatically on startup, and a fresh/empty database is seeded with
default catalog data the first time the server runs — no manual migration step
is required.

- The data layer lives in [`db.ts`](db.ts) and exposes `readDB`/`writeDB`/`initDB`.
- The REST API in [`server.ts`](server.ts) is unchanged from the client's
  perspective, so the frontend works without modifications.
- `POST /api/reset` restores the seed data.
