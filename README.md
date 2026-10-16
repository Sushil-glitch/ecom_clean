# ⚡ ElectroZone - Production Full-Stack MERN E-Commerce Platform

A production-ready, feature-rich Full-Stack MERN (MongoDB, Express.js, React, Node.js) E-Commerce Web Application built with role-based access control for **Clients**, **Administrators**, and **Delivery Partners**.

---

## 🌟 Key Features

### 🛍️ Client Portal
- **Interactive Shop Catalog**: Real-time product search, category pre-filtering, and live stock tracking.
- **Wishlist & Cart**: 1-click **Move All to Cart** feature, live coupon validation (`DEMO03`), and **"You Saved ₹XXX"** order summary badges.
- **Order Tracking Stepper**: Visual 5-stage sequential progress bar (`Placed` -> `Confirmed` -> `Processed` -> `Out for Delivery` -> `Received`).
- **Printable Tax Invoices**: Itemized PDF/print billing receipt with GSTIN and discount breakdowns.

### 👑 Admin Portal
- **Real-Time Control Center**: Live user stats, revenue analytics, and Low Stock Warning Alerts (`Stock ≤ 5`).
- **1-Click Sales Report CSV Exporter**: Download formatted sales spreadsheets (`electrozone-sales-report.csv`).
- **Quick Inventory Restock (+10 / +50)**: 1-click stock updates without opening full edit modals.
- **Order Dispatch & Driver Management**: Auto vs Manual delivery assignment modes and driver COD cash settlement.

### 🚚 Delivery Partner Portal
- **Daily Quest Milestone Challenge**: Real-time progress bar tracking 5 completed deliveries per day to unlock an automatic **₹500 Performance Cash Bonus**.
- **1-Click Turn-by-Turn GPS Navigation**: Google Maps directions launched directly from active order cards.
- **1-Click WhatsApp Customer Contact**: Pre-filled arrival notification messages sent directly to customers via WhatsApp.
- **Weekly Earnings & Performance Analytics Bar Chart**: 7-day visual payout ledger and COD cash tracking.

---

## 🚀 How to Upload Project to GitHub

Execute the following commands in your project root terminal (`ecom_clean/`):

```bash
# 1. Initialize Git Repository
git init

# 2. Add All Project Files
git add .

# 3. Commit Your Changes
git commit -m "Initial commit - Production MERN E-Commerce Platform"

# 4. Create a New Repository on GitHub (github.com/new) and link it:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/electrozone-ecom.git

# 5. Push to GitHub
git push -u origin main
```

---

## ⚡ How to Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
2. Select your imported **GitHub Repository** (`electrozone-ecom`).
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api` (or your backend domain)
5. Click **Deploy**. Vercel will automatically build and publish your frontend with client-side SPA routing support (`vercel.json`).

---

## 🖥️ How to Deploy Backend (Render / Vercel)

### Option A: Render (Recommended for Express + Node.js)
1. Go to [Render Dashboard](https://dashboard.render.com/) and create a **Web Service**.
2. Connect your GitHub repository.
3. Set Directory & Commands:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables:
   - `MONGO_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_random_jwt_secret_key`
   - `PORT`: `5000`
   - `CLIENT_URL`: `https://your-frontend-vercel-url.vercel.app`

### Option B: Vercel Serverless Function
- The project includes `backend/vercel.json` and serverless export support in `server.js`. Deploy the `backend` folder directly on Vercel as a Node serverless service.

---

## 🍃 MongoDB Atlas Setup (Cloud Database)

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User & Network Access rule (`0.0.0.0/0` to allow cloud connections).
3. Copy your connection string and add it to your Backend Environment Variables as `MONGO_URI`.
4. Seed default promo code:
   ```bash
   cd backend
   node seedCoupons.js
   ```

---

## 💻 Local Development Setup

```bash
# 1. Backend Setup
cd backend
npm install
cp .env.example .env     # Configure MONGO_URI and JWT_SECRET
npm run dev

# 2. Database Seeding (Non-destructive)
npm run seed:admin       # Creates/verifies Admin account
npm run seed:products    # Seeds flagship ElectroZone products
npm run seed:all-products# Seeds Books, Electronics, and Gadgets
npm run seed:coupons     # Seeds DEMO03, WELCOME10, FLAT100
npm run seed:users       # Seeds test client & delivery accounts

# 3. Frontend Setup (in a new terminal)
cd frontend
npm install
cp .env.example .env     # Points to http://localhost:5000/api
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🔑 Pre-Configured Demo Credentials

| Role | Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@myapp.com` | `Admin@12345` | Control Center, Inventory Restock, Revenue Analytics, Sales CSV Export |
| **Customer / Client** | `client.test@electrozone.com` | `Client@12345` | Storefront, Cart, Wishlist, Order Placement, Live Order Tracking |
| **Delivery Driver** | `driver.test@electrozone.com` | `Driver@12345` | Dispatch Dashboard, OTP Verification, GPS Navigation, Wallet & Payouts |

### 🎟️ Active Demo Coupons

* `DEMO03` — **20% OFF** (up to ₹500 discount)
* `WELCOME10` — **10% OFF** (up to ₹200 discount)
* `FLAT100` — **Flat ₹100 OFF** on orders above ₹499

