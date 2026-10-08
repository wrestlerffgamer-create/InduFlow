# FlowForge

FlowForge is a role-based industrial workflow management application for the fixed pipeline **Design → Production → Quality Checking → Dispatch**. It helps an industrial team track an order from creation through dispatch, surface late stages, and give every role the information and controls appropriate to it.

## What it does

- Runs each order through the four fixed departments in sequence.
- Requires every active worker in a department to mark their own work complete before the order moves to the next department.
- Detects overdue active stages automatically on a configurable schedule and records delay notifications and audit logs.
- Separates access for admins, CEOs, department heads, and workers.
- Lets workers mark daily attendance and send suggestions or grievances to their department head.
- Lets heads review departmental feedback and send staffing requests to admins.
- Lets admins create users and orders, and approve or reject staffing requests.
- Shows CEOs company-wide analytics and heads analytics restricted to their department.

## Roles

| Role | Access |
| --- | --- |
| `worker` | Current departmental work, personal completion status, attendance, feedback, notifications |
| `*_head` | Department analytics, feedback, active workers, staffing requests |
| `admin` | Create users and orders, review staffing requests, run an on-demand delay check |
| `ceo` | Company-wide workflow, completion, and delay analytics |

The supported head roles are `design_head`, `production_head`, `quality_head`, and `dispatch_head`.

## Tech stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express, JWT, bcrypt
- Database: PostgreSQL

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Local setup

1. Create a PostgreSQL database named `flowforge`.
2. Copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and set a real database URL and a long random JWT secret. Do not commit this file.
3. Install dependencies in both applications:

   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Create all tables and the four fixed departments:

   ```sh
   cd backend
   npm run db:schema
   ```

5. Create the first administrator. The command accepts a name, email, and password (at least eight characters):

   ```sh
   npm run create-admin -- "Admin Name" admin@example.com a-strong-password
   ```

6. Start the backend and frontend in separate terminals:

   ```sh
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

Open the frontend URL printed by Vite (normally `http://localhost:5173`) and sign in with the administrator account. Use the admin dashboard to add department heads and workers before starting orders.

## Workflow behaviour

When an admin creates an order, its Design stage starts immediately. A stage has an expected duration in hours. FlowForge checks active stages every five minutes by default (`DELAY_CHECK_INTERVAL_MS`) and marks an overdue stage as delayed once. Completing a delayed stage is still possible. When all active workers in that stage have completed their own progress item, FlowForge completes the stage, creates an audit entry, activates the next department, and notifies it. The final Dispatch completion marks the order completed.

## API overview

All API routes except `POST /api/auth/login` require a JWT in the form `Authorization: Bearer <token>`.

- `POST /api/auth/login`, `GET /api/auth/me`
- `GET|POST /api/users`, `GET /api/users/departments`, `PATCH /api/users/:id/active`
- `GET|POST /api/orders`
- `GET /api/stages/my-work`, `POST /api/stages/my-progress`
- `POST /api/worker/attendance`, `POST /api/worker/feedback`
- `GET|POST /api/head/requests`, `GET /api/head/feedback`, `GET /api/head/workers`
- `GET|PATCH /api/requests` for admins
- `GET /api/analytics/dashboard`
- `GET /api/notifications/:userId`

## Verification

```sh
cd backend && npm test
cd frontend && npm run lint && npm run build
```

The repository intentionally does not contain production credentials. If credentials were ever committed, rotate them in PostgreSQL and replace the affected `.env` value before deployment.
