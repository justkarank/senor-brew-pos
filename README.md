# Senor Brew Club

Senor Brew Club is a full-stack cafe POS and management system built for the Senor Brew Club Cafe Business. It includes role-based login, billing, kitchen order flow, menu management, inventory tracking, and a sales dashboard with permanent demo data.

## Features

- Role-based login with JWT authentication
- Billing screen with category filters, search, cart, discount, GST, and bill generation
- Real-time kitchen updates using Socket.io
- Menu CRUD with availability and stock validation
- Inventory alerts with inline restocking
- Sales dashboard with revenue, orders, top item, hourly chart, and order history
- Permanent demo users, menu items, and daily sample orders for presentation

## Roles

| Role | Access |
| --- | --- |
| Admin | Dashboard, billing, kitchen, menu, inventory |
| Counter | Billing |
| Kitchen | Kitchen display |

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- Recharts
- Socket.io Client

### Backend

- Node.js
- Express
- MongoDB Atlas with Mongoose
- JWT
- bcryptjs
- Socket.io

## Project Structure

```text
senorbrew/
|-- backend/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   |-- seed.js
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   `-- utils/
|   `-- vite.config.js
|-- render.yaml
|-- setup.js
|-- package.json
`-- README.md
```

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@senorbrew.com` | `admin123` |
| Counter | `counter@senorbrew.com` | `counter123` |
| Kitchen | `kitchen@senorbrew.com` | `kitchen123` |

## Demo Data

The demo bootstrap creates and preserves:

- 3 users
- 15 menu items
- 30 demo orders for the current business day
- active kitchen orders for live workflow demo
- existing real data unless you explicitly run a reset

## Local Setup

### 1. Create backend env

Copy `backend/.env.example` to `backend/.env` and set:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
CLIENT_URLS=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=true
```

If you want localhost and the deployed site to reflect the same data, use the same Atlas cluster and database name in your local `MONGO_URI` and in Render.

### 2. Create frontend env

Copy `frontend/.env.example` to `frontend/.env` and set:

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_SOCKET_URL=http://127.0.0.1:5000
```

### 3. Allow MongoDB Atlas access

If Atlas is blocking connections, add your current IP or `0.0.0.0/0` in:

`MongoDB Atlas -> Security -> Network Access`

This is required for localhost and for Render unless you use a stricter allowlist that includes Render egress IPs.

### 4. Install and seed

From the project root:

```powershell
npm run setup
```

This installs backend and frontend dependencies and safely fills in the demo database without deleting existing data.

### 5. Run locally

Terminal 1:

```powershell
npm run backend
```

Terminal 2:

```powershell
npm run frontend
```

Open:

`http://localhost:5173`

## Useful Commands

From the project root:

```powershell
npm run setup
npm run backend
npm run frontend
npm run build
npm run seed
npm run seed -- --reset
npm run verify
```

Direct commands if needed:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

## Main API Routes

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/menu`
- `GET /api/menu/available`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`
- `GET /api/orders/today`
- `POST /api/orders`
- `PUT /api/orders/:id/status`
- `GET /api/dashboard/stats`
- `GET /api/health`

## Deployment

### Render Backend

`render.yaml` is included. Set these environment variables in Render:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URLS`
- `ALLOW_VERCEL_PREVIEWS=true`

Recommended `CLIENT_URLS` value:

```env
http://localhost:5173,https://your-project.vercel.app,https://your-custom-domain.com
```

### Vercel Frontend

You can deploy this repo to Vercel in either of these ways:

- Point the Vercel project root to `frontend`
- Or deploy the repo root directly; the root `vercel.json` now builds `frontend/dist` automatically

Set these environment variables in Vercel:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

`frontend/vercel.json` already handles SPA rewrites for React Router.

If `VITE_API_URL` or `VITE_SOCKET_URL` is missing in Vercel, the frontend now shows a clear configuration warning on the login screen instead of failing with a vague backend error.

The backend also auto-fills missing demo data on startup by default so the dashboard and kitchen screens stay populated on future days. Set `ENABLE_DEMO_BOOTSTRAP=false` if you want to turn that off.

### MongoDB Atlas

Make sure Atlas allows connections from:

- your local machine during development
- your Render backend in production

If localhost cannot connect, Atlas Network Access is the first thing to check. The current app now already reports this clearly on backend startup.

If you want the easiest setup for demo purposes, use `0.0.0.0/0` in Atlas Network Access.

## GitHub Auto Deploy Flow

Once Render and Vercel are connected to your GitHub repo, every push to your deploy branch will auto-deploy.

Typical flow:

```powershell
git add .
git commit -m "Stabilize local and deployment setup"
git push origin main
```

If your hosted apps are already linked to the same GitHub branch, that push will automatically update Render and Vercel.

## Notes

- The backend now validates required env vars on startup.
- `npm run seed` is now non-destructive; use `npm run seed -- --reset` only when you intentionally want a full fresh demo rebuild.
- The login screen now wakes the Render backend before sign-in and retries transient connection failures once, which helps with free-tier cold starts.
- GET requests retry once after a backend warm-up check when the server was temporarily unreachable.
- CORS origin matching now normalizes configured URLs, so entries with trailing slashes in `CLIENT_URLS` do not break production requests.
- The frontend now has safer session handling and route-level code splitting.
- Currency display and demo UI text were cleaned up so the hosted app looks correct during explanation/demo.
