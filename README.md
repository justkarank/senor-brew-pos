# Senor Brew Club

Senor Brew Club is a full-stack cafe POS and management system built for BCA major project submission. It covers billing, kitchen workflow, menu management, inventory tracking, and daily sales reporting with role-based access for `admin`, `counter`, and `kitchen`.

## Main Features

- Role-based login with JWT authentication
- Billing screen with search, category filter, cart, discount, GST, and bill generation
- Real-time kitchen updates using Socket.io
- Menu CRUD and item availability control
- Inventory alerts with inline stock updates
- Sales dashboard with revenue, order count, average order value, top-selling item, hourly trends, and order history
- Seed data for quick demo and testing

## Roles

| Role | Access |
| --- | --- |
| Admin | Dashboard, billing, kitchen, menu management, inventory |
| Counter | Billing and order creation |
| Kitchen | Kitchen orders and status updates |

## Important Business Rules

- GST is `5%`
- Discount is applied first, then GST is calculated
- Order statuses are `pending`, `preparing`, and `ready`
- Categories are `Coffee`, `Tea`, `Snacks`, `Cold Drinks`, and `Other`
- Only available items with stock are shown for billing
- Stock is reduced when an order is placed
- Token numbers are generated uniquely per day

## Project Quality Fixes

- Backend RBAC is enforced, not just frontend route protection
- Order totals are calculated on the backend from database prices
- Negative stock is prevented through backend validation
- Daily token generation is atomic and safe for concurrent orders
- Order creation, stock update, and token allocation are kept consistent with MongoDB transactions

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
- MongoDB Atlas / MongoDB with Mongoose
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
|   |   `-- pages/
|   `-- vite.config.js
|-- BCA_PROJECT_FIX_REPORT.md
|-- render.yaml
|-- setup.js
`-- README.md
```

## Main API Routes

- `POST /api/auth/login`
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

## Local Setup

### Prerequisites

- Node.js and npm
- MongoDB connection string

### Backend `.env`

Create `backend/.env` and set:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
CLIENT_URLS=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=true
```

### Frontend `.env` (optional for local)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Quick Setup

```powershell
node setup.js
```

This installs dependencies and seeds demo data.

### Start Locally

Backend:

```powershell
cd backend
npm run dev
```

Frontend:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173`

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@senorbrew.com` | `admin123` |
| Counter | `counter@senorbrew.com` | `counter123` |
| Kitchen | `kitchen@senorbrew.com` | `kitchen123` |

## Seed Data

The seed script creates:

- 3 users
- 15 menu items
- 30 sample orders
- live kitchen-ready orders for demo

## Scripts

### Root

- `node setup.js` - install dependencies and seed database

### Backend

- `npm start` - start backend
- `npm run dev` - start backend with nodemon
- `npm run seed` - reseed database

### Frontend

- `npm run dev` - start frontend
- `npm run build` - production build
- `npm run preview` - preview build

## Deployment

This project is already compatible with:

- GitHub
- Render for backend
- Vercel for frontend
- MongoDB Atlas for database

Use backend env vars for CORS and frontend env vars for API and Socket.io URLs. `render.yaml` and `frontend/vercel.json` are already included.
