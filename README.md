# Jains Computer LMS

Student learning portal and admin panel for Jains Computer: recorded classes (Cloudflare R2 + HLS),
biometric-style attendance with campus geofence, and fee status synced from the ERP.

| Folder      | What it is |
|-------------|------------|
| `backend/`  | Node.js + Express API, MongoDB (Mongoose), Redis cache + BullMQ video worker |
| `frontend/` | Next.js 14 static export (`next build` → `frontend/out/`) |

## Local setup

```bash
# Backend
cd backend
cp .env.example .env      # fill in the values (see below)
npm install
npm run dev               # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev               # http://localhost:3000 (uses NEXT_PUBLIC_API_URL from .env.local)
```

The backend **refuses to start** unless `JWT_SECRET`, `ERP_API_KEY` and `ADMIN_GATEWAY_TOKEN` are set.
There are no built-in default secrets.

> Use a separate development database in `MONGODB_URI`. Pointing local development at the
> production cluster means every test login or attendance punch changes real student data.

## Tests

```bash
cd backend && npm test    # Vitest + in-memory MongoDB, ERP in mock mode (no real network calls)
```

## Deploy

1. Backend: deploy `backend/` with its production `.env`, then restart the process.
2. Frontend: `cd frontend && npm run build`, then upload the contents of `frontend/out/`.

`frontend/out/` and `*.zip` archives are build artifacts and are not tracked in git.

## Security notes

- Student logins are checked against a bcrypt hash. So that admins can still see a student's
  current password on the student page, an AES-256-GCM encrypted copy is kept (`passwordEnc`,
  key from `PASSWORD_VIEW_KEY` or derived from `JWT_SECRET`); it is never stored in plain text.
  A password reset signs the student out everywhere.
  Move old plain-text copies into the encrypted field once with
  `node scripts/encrypt-plain-passwords.js --apply` (run without `--apply` first for a dry run).
- The admin gateway token is shipped to the browser, so it only hides the admin API from scanners.
  Real protection is the admin login (JWT + session) checked on every admin route.
- Student accounts can only be created by a logged-in admin or by the ERP bridge (`X-API-KEY`).
- Create the first admin with `node scripts/seedAdmin.js` (reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment).
