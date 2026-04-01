# Drona-a-charya v2 — MongoDB + Auth Edition

## What changed from v1

| File | Status | What changed |
|---|---|---|
| `backend/server.js` | REPLACED | Now connects to MongoDB via Mongoose |
| `backend/routes/auth.js` | REPLACED | Real JWT login + 3-slide register |
| `backend/routes/mentors.js` | REPLACED | Reads mentors from MongoDB (not hardcoded) |
| `backend/routes/sessions.js` | REPLACED | Saves sessions to MongoDB |
| `backend/models/User.js` | NEW | Mongoose schema for users + mentors |
| `backend/models/Session.js` | NEW | Mongoose schema for sessions |
| `backend/middleware/auth.js` | NEW | JWT verification middleware |
| `backend/db.js` | REMOVED | Not needed — Mongoose handles connection in server.js |
| `frontend/index.html` | REPLACED | Auth overlay with login + 3-slide signup |
| `frontend/js/app.js` | REPLACED | Auth gate + fetches real mentor data from API |
| `frontend/js/data.js` | REMOVED | No longer needed — data comes from MongoDB |
| `frontend/css/auth.css` | NEW | Auth overlay styles |
| `frontend/css/style.css` | REPLACED | Updated app styles |
| `.env` | NEW | MongoDB URI + JWT secret |

---

## Prerequisites

- Node.js v16+
- MongoDB Compass installed and running locally

---

## Step 1 — Install dependencies

```bash
npm install
```

---

## Step 2 — Start MongoDB

Open MongoDB Compass and connect to:
```
mongodb://127.0.0.1:27017
```
The database `dronacharya` will be created automatically when the first user registers.

---

## Step 3 — Start the server

```bash
npm start
```

Server starts at: http://localhost:3000

---

## Step 4 — Open the app

Go to http://localhost:3000

You will see the auth screen. Sign up as a **Mentor** first — fill all 3 slides including your expertise. Then sign up as a **Student** and browse the mentors you just created.

---

## How mentor data flows

1. A user signs up and selects "Mentor" on slide 2
2. They fill institution, designation, expertise, and bio on slide 3
3. On submit, `POST /api/auth/register` saves the user to MongoDB with `role: "mentor"`
4. When any logged-in user opens the app, `GET /api/mentors` queries MongoDB for all users where `role === "mentor"`
5. The frontend renders those real mentor cards — no more dummy data

---

## MongoDB collections in Compass

After first use, open Compass and you will see:

**dronacharya** database with:
- `users` — all registered users (students + mentors). Mentor fields: institution, designation, expertise[], bio, experience, available
- `sessions` — all session booking requests with status pending/confirmed/cancelled

---

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | None | Register student or mentor |
| POST | /api/auth/login | None | Login, returns JWT |
| GET | /api/mentors | JWT | List all mentors from DB |
| GET | /api/mentors/:id | JWT | Single mentor |
| POST | /api/sessions | JWT | Book a session |
| GET | /api/sessions/my | JWT | My sessions |
| PATCH | /api/sessions/:id | JWT | Update session status |
