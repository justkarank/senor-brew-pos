# Senor Brew Club - Cafe POS & Management System

Senor Brew Club is a full-stack cafe POS and operations platform built for billing, kitchen workflow, menu administration, inventory monitoring, and daily sales reporting. It is designed around three staff roles - admin, counter, and kitchen - with real-time order updates between the billing counter and kitchen display.

## Summary

This project combines a React frontend with an Express and MongoDB backend to manage the day-to-day workflow of a cafe. Counter staff can create bills and send orders to the kitchen, kitchen staff can update preparation status in real time, and admins can manage menu items, track stock levels, and review sales performance for the day.

Core business flow:

1. Staff sign in with a role-based account.
2. Counter staff create an order from the live menu.
3. The system applies discount and 5% GST, generates a daily token number, and saves the order.
4. The order is pushed to the kitchen screen through Socket.io.
5. Kitchen staff move the order from `pending` to `preparing` to `ready`.
6. Admins monitor sales, inventory health, and menu availability.

## Key Features

- Role-based authentication with JWT and protected routes
- Dedicated flows for admin, counter, and kitchen staff
- Billing screen with category filters, search, cart controls, discounts, GST calculation, and token generation
- Real-time kitchen order board powered by Socket.io
- Menu CRUD with item availability toggles
- Inventory alerts for low and critical stock levels with inline stock updates
- Daily sales dashboard with revenue, order count, average order value, top-selling item, hourly chart, and order history
- Seed script with demo users, menu items, and sample orders for quick testing

## User Roles

| Role | Access |
| --- | --- |
| Admin | Sales dashboard, billing, kitchen display, menu management, inventory alerts |
| Counter | Billing screen |
| Kitchen | Kitchen display |

## Screens Included

- `Login` - secure login with quick demo account prefills
- `Billing` - searchable menu, cart, discount input, GST calculation, and bill generation
- `Kitchen Display` - live incoming orders and status updates
- `Menu Management` - create, edit, delete, categorize, and toggle menu items
- `Inventory Alerts` - monitor low stock and restock items inline
- `Sales Dashboard` - today's KPIs, hourly order trends, and order list

## Tech Stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Recharts
- Socket.io Client
- Lucide React

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs
- Socket.io

## Project Structure

```text
senorbrew/
|-- backend/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- .env.example
|   |-- package.json
|   |-- seed.js
|   `-- server.js
|-- frontend/
|   |-- .env.example
|   |-- src/
|   |   |-- components/
|   |   `-- pages/
|   |-- package.json
|   |-- vercel.json
|   `-- vite.config.js
|-- render.yaml
|-- setup.js
`-- README.md
```

## API Overview

### Auth

- `POST /api/auth/login` - sign in and receive JWT token

### Menu

- `GET /api/menu` - fetch all menu items
- `GET /api/menu/available` - fetch only available items for billing
- `POST /api/menu` - create a menu item
- `PUT /api/menu/:id` - update a menu item
- `DELETE /api/menu/:id` - delete a menu item

### Orders

- `GET /api/orders/today` - fetch today's orders
- `POST /api/orders` - create a new order
- `PUT /api/orders/:id/status` - update order status

### Dashboard

- `GET /api/dashboard/stats` - fetch today's dashboard metrics and order list

### Utility

- `GET /api/health` - backend health check

## Local Setup

### Prerequisites

- Node.js and npm
- A MongoDB connection string

### 1. Create environment file

From the project root:

```powershell
Copy-Item backend/.env.example backend/.env
```

Then update `backend/.env` with your values:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
```

### 2. Quick setup

After `backend/.env` is configured, run:

```powershell
node setup.js
```

This script:

- installs backend dependencies
- installs frontend dependencies
- seeds the database with demo users, menu items, and sample orders

### 3. Start the app

Run the backend in one terminal:

```powershell
cd backend
npm run dev
```

Run the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

## Demo Credentials

Use the seeded accounts below:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@senorbrew.com` | `admin123` |
| Counter | `counter@senorbrew.com` | `counter123` |
| Kitchen | `kitchen@senorbrew.com` | `kitchen123` |

## Seed Data

The seed script creates:

- 3 user accounts
- 15 menu items across coffee, tea, snacks, cold drinks, and other categories
- 30 sample orders
- active kitchen orders so the kitchen screen is immediately demo-ready

## Business Rules Implemented

- Only available menu items appear on the billing screen
- Discounts are entered as a percentage and clamped between 0 and 100
- GST is calculated at 5%
- Order token numbers increment per day
- Stock is reduced automatically when an order is placed
- Inventory warnings are split into:
  - low stock: 5 to 9 units
  - critical stock: below 5 units
- Order statuses move through `pending`, `preparing`, and `ready`

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign auth tokens |
| `PORT` | No | Backend port, defaults to `5000` |
| `CLIENT_URLS` | No | Comma-separated allowed frontend URLs for CORS |
| `ALLOW_VERCEL_PREVIEWS` | No | Allows `*.vercel.app` preview URLs when set to `true` |

### Frontend

Create `frontend/.env` from `frontend/.env.example` when needed:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

For production, point both values to your deployed backend URL.

## Local Development Notes

The current codebase is configured for local development with fixed URLs:

- frontend runs on `http://localhost:5173`
- backend runs on `http://localhost:5000`

If you deploy this project, update these locations:

- `backend/.env` for allowed frontend origins
- `frontend/.env` for API and Socket.io URLs

## Scripts

### Root

- `node setup.js` - install dependencies and seed the database

### Backend

- `npm start` - start backend server
- `npm run dev` - start backend with nodemon
- `npm run seed` - seed database with demo data

### Frontend

- `npm run dev` - start Vite dev server
- `npm run build` - build production frontend
- `npm run preview` - preview production build

## Free Deployment Path

The cleanest free setup for this project is:

- GitHub for source control
- Render for the Node.js backend
- Vercel for the React frontend
- MongoDB Atlas for the database

This repo is already prepared for that setup:

- backend CORS now supports environment-based frontend URLs
- frontend API and Socket.io URLs are environment-based
- `frontend/vercel.json` handles SPA routing
- `render.yaml` is included for the backend service

### 1. Push the project to GitHub

If you are starting from this local folder:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

Then create an empty GitHub repository and connect it:

```powershell
git remote add origin https://github.com/<your-username>/senorbrew.git
git push -u origin main
```

If `git commit` fails because your identity is not set, run:

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 2. Deploy the backend on Render

1. Sign in to Render.
2. Create a new Web Service from your GitHub repo.
3. Set the root directory to `backend` if Render does not infer it from `render.yaml`.
4. Set these environment variables:
   `MONGO_URI`
   `JWT_SECRET`
   `CLIENT_URLS`
   `ALLOW_VERCEL_PREVIEWS=true`
5. Deploy and copy the backend URL, for example:
   `https://senorbrew-backend.onrender.com`

Before deploying, make sure your MongoDB Atlas project allows connections from your hosted backend. For a simple hobby deployment, add an Atlas Network Access entry for:

```text
0.0.0.0/0
```

Recommended values:

- `CLIENT_URLS=https://your-frontend-name.vercel.app`
- `ALLOW_VERCEL_PREVIEWS=true`

Health check path:

```text
/api/health
```

### 3. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set the root directory to `frontend`.
3. Add these environment variables:

```env
VITE_API_URL=https://your-render-backend.onrender.com
VITE_SOCKET_URL=https://your-render-backend.onrender.com
```

4. Deploy.

### 4. Final production check

After both services are live:

1. Open the Vercel frontend URL.
2. Log in with one of the seeded demo accounts.
3. Create an order from Billing.
4. Confirm it appears in Kitchen in real time.
5. Refresh a nested route like `/dashboard` to confirm SPA routing works.

## Why This Project Stands Out

Senor Brew Club is not just a billing interface. It models the full cafe workflow:

- front-of-house billing
- back-of-house kitchen coordination
- menu operations
- stock awareness
- daily business reporting

That makes it a strong portfolio project for full-stack product development because it combines authentication, CRUD operations, real-time communication, analytics, and role-based UX in one system.
