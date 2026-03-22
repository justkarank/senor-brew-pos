# BCA Project Fix Report

## Project
Senor Brew Club  
Cafe POS + Kitchen + Inventory + Dashboard

## What Was Changed

### 1. Backend role-based access control
- Added `requireAuth` and `allowRoles(...roles)` middleware.
- Backend routes now enforce role permissions instead of relying only on frontend route protection.
- Admin-only access is enforced for dashboard, menu management, and inventory-related menu APIs.
- Order creation is restricted to `admin` and `counter`.
- Kitchen order viewing and order status updates are restricted to `admin` and `kitchen`.

### 2. Safe billing calculation on backend
- Backend no longer trusts client subtotal, discount, GST, or total values.
- Frontend now sends ordered items and discount percentage only.
- Backend fetches menu prices from MongoDB and calculates subtotal, discount, GST, and final total itself.
- Discount is applied first, then GST is calculated at `5%`.
- Final amounts are rounded to 2 decimals and returned as authoritative values.

### 3. Inventory and stock safety
- Backend validates each ordered item before saving the order.
- Validation checks item existence, availability, quantity, and stock sufficiency.
- Stock cannot go negative during normal API use.
- When stock becomes `0`, `isAvailable` is automatically set to `false`.

### 4. Duplicate daily token fix
- Replaced `countDocuments() + 1` token generation.
- Added a dedicated `Counter` model for daily token allocation.
- Token generation is now atomic and safe even if multiple orders are created quickly.
- Orders store an `orderDateKey` so token uniqueness is tracked per day.

### 5. Safer order creation flow
- Added a dedicated order service to keep the route logic simple and modular.
- Token allocation, stock decrement, and order creation are handled together with a MongoDB transaction.
- Socket events are emitted only after the order is successfully created.

### 6. Frontend alignment
- Billing screen now matches the new backend contract.
- Frontend uses backend-returned totals after order creation.
- Error handling was improved for unauthorized access, forbidden actions, invalid order input, and stock problems.
- Menu and inventory screens now stay aligned with backend stock and availability rules.

## Which Main Issues Were Fixed

### Issue 1: Missing backend authorization
Fixed by backend RBAC middleware and route-level role checks.

### Issue 2: Frontend-trusted billing totals
Fixed by server-side price lookup and server-side total calculation.

### Issue 3: Negative stock and wrong availability
Fixed by stock validation and automatic availability updates.

### Issue 4: Duplicate token numbers
Fixed by atomic daily counter allocation.

## How The New Billing Calculation Works
- Subtotal = sum of `(database price x quantity)` for all ordered items.
- Discount amount = `subtotal x discountPercentage / 100`.
- Taxable amount = `subtotal - discount`.
- GST = `5%` of taxable amount.
- Final total = `taxable amount + GST`.
- All values are rounded to 2 decimals.

## How Role-Based Access Now Works
- `admin`: dashboard, billing, kitchen, menu management, inventory
- `counter`: billing and order creation
- `kitchen`: kitchen orders and status updates

## How Token Generation Now Works
- A `Counter` document is maintained for each business day.
- When a new order is created, the current day counter is incremented atomically.
- The incremented value becomes the order token number.
- This prevents duplicate token numbers for the same day.

## Viva-Friendly Summary
The project was improved mainly in four areas:
- backend security
- backend billing correctness
- inventory and stock safety
- token generation under concurrent order creation

The UI flow and deployment structure were kept almost the same, but the backend is now safer, more correct, and stronger for BCA project evaluation and demo.
