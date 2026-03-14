# [cite_start]Antigravity Master Blueprint: Education Loan Lead & Referral Network Program [cite: 2]

## 🏗️ 1. Complete Application Architecture
* **Frontend (User Interface):** React (Next.js) for high performance and scalable serverless hosting.
* **Backend (Server & API):** Python (FastAPI) for highly efficient, optimized algorithmic data routing and commission calculations.
* **Database:** PostgreSQL (via Supabase or Neon Cloud) to ensure relational data integrity between students and ambassadors.

---

## 🗄️ 2. Database Schema Definitions (SQLModel / SQLAlchemy)

**Task:** Define the PostgreSQL database schema for the referral platform.
**Requirements:**

### A. Ambassador Table
* **id**: UUID (Primary Key)
* **full_name**: String (Required)
* **email**: String (Unique, Required)
* **phone_number**: String (Required)
* **college_name**: String (Required)
* **referral_code**: String (Unique, Indexed, Required) - *Used for auto-tagging leads.* [cite: 42, 49]
* **created_at**: DateTime (Default: UTC now)

### B. Lead Table
* **id**: UUID (Primary Key)
* [cite_start]**student_name**: String (Required) [cite: 45]
* **contact_email**: String (Required) [cite: 46]
* **contact_phone**: String (Required) [cite: 46]
* **course_and_university**: String (Required) [cite: 47]
* [cite_start]**loan_requirement**: Float (Required) [cite: 48]
* **referral_code**: String (Nullable, Foreign Key linking to `Ambassador.referral_code`) [cite: 49]
* **ambassador_id**: UUID (Nullable, Foreign Key linking to `Ambassador.id`)
* **status**: String (Default: "Pending", Options: "Pending", "Processing", "Approved", "Disbursed", "Rejected")
* **created_at**: DateTime (Default: UTC now)

### C. Disbursement & Commission Table
* **id**: UUID (Primary Key)
* **lead_id**: UUID (Foreign Key linking to `Lead.id`, Required)
* **disbursed_amount**: Float (Required)
* **commission_earned**: Float (Required)
* **disbursement_date**: DateTime (Required)
* **commission_paid_status**: Boolean (Default: False)
* **commission_paid_date**: DateTime (Nullable)

---

## ⚙️ 3. Backend Agent Prompts (Python / FastAPI)

### Prompt 3.1: The Lead Routing & Auto-Tagging Algorithm
**Task:** Write the core FastAPI endpoint and service logic for ingesting new leads (`POST /api/leads`).
**Requirements:**
1. Accept the incoming lead payload.
2. [cite_start]Extract the `referral_code` from the payload[cite: 49].
3. Write an optimized validation algorithm to verify if the referral code exists in the `Ambassador` table.
4. [cite_start]If a match is found, automatically tag the lead to that specific ambassador's ID in the database[cite: 42].
5. If no match is found, flag the lead as an "Organic/Direct" lead.
6. [cite_start]Return a strict validation response confirming the lead was recorded in the central tracking sheet/database[cite: 50].

### Prompt 3.2: Commission & Revenue Split Calculator Engine
[cite_start]**Task:** Build the algorithmic logic to calculate payouts when a loan is marked as "Disbursed"[cite: 15].
**Requirements:**
1. Create a service function `calculate_commission(loan_amount: float, ambassador_id: str)`.
2. Implement the primary tiered commission structure:
   - [cite_start]Up to ₹10 Lakhs = ₹3,000[cite: 57].
   - [cite_start]₹10–25 Lakhs = ₹5,000[cite: 57].
   - [cite_start]₹25 Lakhs+ = ₹8,000+[cite: 57].
3. [cite_start]Add a configuration toggle for an alternative calculation model of 0.25% – 0.50% of the disbursed loan amount[cite: 59].
4. [cite_start]Implement the overarching revenue split logic ensuring the company retains 60–70% and the ambassador receives 30–40% of the bank commission[cite: 101].
5. [cite_start]Ensure the function generates a payout record with a payment timeline targeted within 7 days of the confirmed disbursement[cite: 60].

### Prompt 3.3: Analytics & Performance Data Aggregation
**Task:** Create an endpoint to feed the Ambassador Dashboard (`GET /api/ambassadors/{id}/performance`).
**Requirements:**
1. [cite_start]Write an optimized aggregation query that returns data for monthly performance reports [cite: 52][cite_start], status updates on referrals [cite: 53][cite_start], and disbursement confirmations[cite: 54].

---

## 🖥️ 4. Frontend Agent Prompts (React / Next.js)

### Prompt 4.1: Landing Page UI & Features
**Task:** Build the main landing page components.
**Requirements:**
1. Create a modern hero section explaining the core value proposition.
2. [cite_start]Add a features section highlighting: free education loan eligibility check [cite: 25][cite_start], multi-bank comparison [cite: 26][cite_start], collateral & non-collateral options [cite: 27][cite_start], and complete documentation support[cite: 28].

### Prompt 4.2: Dynamic Lead Capture Form with Auto-Tracking
**Task:** Build the student-facing loan application form.
**Requirements:**
1. [cite_start]Build a React form capturing: Student Name [cite: 45][cite_start], Contact Details [cite: 46][cite_start], Course & University [cite: 47][cite_start], and Loan Requirement[cite: 48].
2. [cite_start]Include a hidden/read-only field for the `referral_code`[cite: 49].
3. Write logic that parses the URL parameters on load. [cite_start]If a parameter like `?ref=RAHUL123` exists[cite: 40], auto-populate the referral code field.
4. On submission, send the payload to `POST /api/leads`.

### Prompt 4.3: Ambassador Authentication & Dashboard
**Task:** Build the secure portal for Campus Finance Ambassadors.
**Requirements:**
1. [cite_start]Create a unique dashboard view [cite: 96] for registered ambassadors.
2. [cite_start]Prominently display the ambassador's Unique Referral Link[cite: 40].
3. [cite_start]Create data visualization components to display real-time tracking [cite: 97][cite_start], referral analytics [cite: 98][cite_start], and monthly performance reports[cite: 52].