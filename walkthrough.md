# Backend Implementation Walkthrough

I have successfully implemented the Backend for the **Education Loan Lead & Referral Network**.

## 🏗️ Architecture
- **Framework**: FastAPI (Python)
- **Database**: SQLModel (SQLite for dev, ready for PostgreSQL)
- **Structure**:
  - [backend/models.py](file:///c:/Users/shrey/OneDrive/Desktop/Business%20Idea/backend/models.py): Database Schema (Ambassador, Lead, Disbursement)
  - `backend/routers/`: API Endpoints
  - `backend/config.py`: Application Settings (Commission rates)

## ✨ Key Features Implemented

### 1. Lead Routing & Auto-Tagging
- **Endpoint**: `POST /api/leads`
- **Logic**: Automatically extracts `referral_code`, validates it against the `Ambassador` table, and tags the lead. If invalid/missing, lead is marked as Organic.

### 2. Commission Engine
- **Logic**: Calculates commission based on loan amount.
- **Models Supported**:
  - **Tiered** (Default): <10L (₹3k), 10-25L (₹5k), >25L (₹8k).
  - **Percentage**: Configurable (default 0.5%).
- **Revenue Split**: Tracks `company_revenue` vs `commission_earned` based on a configurable `BANK_COMMISSION_RATE` (default 2%).

### 3. Analytics
- **Endpoint**: `GET /api/analytics/ambassadors/{id}/performance`
- **Data**: Returns total leads, status breakdown, and total earnings.

## 🧪 Verification
I created and ran a verification script `verify_backend.py` that mimics a real-world flow:
1.  **Created Ambassador** "Rahul Sharma" (Code: RAHUL123).
2.  **Submitted Lead** "Priya Singh" with code `RAHUL123`.
    - *Result*: Lead was correctly tagged to Rahul.
3.  **Disbursed Lead** (₹50 Lakhs).
    - *Result*: Commission calculated as ₹8,000 (Tiered > 25L).
4.  **Checked Analytics**.
    - *Result*: Dashboard reflected ₹8,000 earnings and 1 Disbursed lead.

## 🚀 How to Run
1.  **Install Python 3.10+**
2.  **Install Dependencies**:
    ```bash
    pip install fastapi uvicorn sqlmodel psycopg2-binary pydantic-settings requests
    ```
3.  **Start Server**:
    ```bash
    uvicorn backend.main:app --reload
    ```
4.  **Run Verification**:
    ```bash
    python verify_backend.py
    ```

## ⚠️ Next Steps (Blocked)
Phase 3 (Frontend) requires **Node.js** and **npx**, which are currently missing in the environment.

# Frontend Implementation Walkthrough

I have implemented the **Frontend (Next.js)** application.

## 🏗️ Architecture
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## ✨ Key Features Implemented

### 1. Landing Page
- **Hero Section**: Responsive design with CTA.
- **Features Section**: Highlight key benefits.

### 2. Lead Capture Form (`/apply`)
- **Auto-Fill**: Extracts `?ref=CODE` from URL `useSearchParams`.
- **Submission**: POSTs data to `http://localhost:8000/api/leads/`.
- **Validation**: Basic HTML5 validation + React state handling.

### 3. Ambassador Dashboard (`/dashboard`)
- **Login**: Simple ID-based entry at `/dashboard`.
- **Dashboard View (`/dashboard/[id]`)**:
  - Fetches real-time stats from Backend (`/api/analytics/...`).
  - Displays **Total Leads**, **Earnings**, and **Recent Activity**.
  - **Referral Link Generator**: Visual display of the unique link with Copy button.

## 🚀 How to Run Full Stack
1.  **Start Backend** (Port 8000):
    ```bash
    uvicorn backend.main:app --reload
    ```
2.  **Start Frontend** (Port 3000):
    ```bash
    cd frontend
    npm run dev
    ```
3.  **Open Browser**: Visit `http://localhost:3000`
