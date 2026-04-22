# FutureIntern Platform — Complete Documentation

> Full-stack internship marketplace with AI-powered matching, CV builder, chatbot, gamification, and multi-platform support.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Models & Schemas](#4-database-models--schemas)
5. [Authentication & Security](#5-authentication--security)
6. [Google OAuth Login](#6-google-oauth-login)
7. [User Profiles & Roles](#7-user-profiles--roles)
8. [Internship Management](#8-internship-management)
9. [Applications Workflow](#9-applications-workflow)
10. [AI-Powered Matching & Recommendations](#10-ai-powered-matching--recommendations)
11. [CV Builder](#11-cv-builder)
12. [AI Chatbot](#12-ai-chatbot)
13. [Points & Rewards System](#13-points--rewards-system)
14. [Admin Dashboard](#14-admin-dashboard)
15. [Push Notifications](#15-push-notifications)
16. [Email System](#16-email-system)
17. [Mobile App](#17-mobile-app)
18. [Web Frontend](#18-web-frontend)
19. [API Reference](#19-api-reference)
20. [Configuration & Environment Variables](#20-configuration--environment-variables)
21. [Deployment](#21-deployment)

---

## 1. Overview

**FutureIntern** is a comprehensive, production-ready internship marketplace platform designed to connect students with companies offering internship positions. It is a multi-platform system covering:

- A **Flask REST API** backend
- A **React + TypeScript** web frontend
- A **React Native / Expo** mobile application

### Key Highlights

| Feature | Description |
|---|---|
| Authentication | Local email/password + Google OAuth + Two-Factor Authentication |
| Role System | Student, Company, Admin — separate UIs and permissions |
| AI Matching | TF-IDF (30%) + Sentence-BERT (70%) cosine similarity for personalized recommendations |
| CV Builder | Full in-app CV editor with PDF export |
| Chatbot | Hugging Face Qwen2.5 (with OpenAI fallback) career assistant |
| Gamification | Points earned on activity, spent on premium features |
| Mobile App | Full-featured React Native/Expo app with push notifications |
| Security | Account lockout, token blacklisting, 2FA, CORS, rate limiting |
| Email | Multi-provider (Mailjet → Brevo → Resend → SMTP fallback) |

---

## 2. Architecture & Tech Stack

### Backend

| Layer | Technology |
|---|---|
| Framework | Flask 2.x |
| ORM | SQLAlchemy |
| Database (dev) | SQLite |
| Database (prod) | PostgreSQL |
| Auth Tokens | Flask-JWT-Extended (JWT) |
| Password Hashing | Werkzeug |
| AI / Chatbot | Hugging Face (Qwen2.5-7B-Instruct), OpenAI fallback |
| NLP / Matching | scikit-learn (TF-IDF), sentence-transformers (SBERT `all-MiniLM-L6-v2`) |
| CV Export | ReportLab (PDF generation) |
| CV Parsing | PyPDF2, python-docx |
| API Docs | Flasgger (Swagger UI at `/apidocs`) |
| Cross-origin | Flask-CORS |
| Email | Mailjet, Brevo, Resend, Flask-Mail (SMTP) |

### Web Frontend

| Layer | Technology |
|---|---|
| Framework | React 18.3 |
| Language | TypeScript |
| Build Tool | Vite 7.2 |
| Styling | Tailwind CSS 3.4 |
| Router | React Router DOM 7.10 |
| Google Auth | @react-oauth/google |
| Drag & Drop | @hello-pangea/dnd |
| Icons | Lucide React |
| Optional DB | Supabase.js |

### Mobile App

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 |
| Platform | Expo SDK 54 |
| Navigation | React Navigation (Native Stack + Bottom Tabs) |
| Auth | Expo Auth Session (Google OAuth) |
| Storage | Expo Secure Store + AsyncStorage |
| Notifications | Expo Notifications |
| Camera/Files | Expo Image Picker, Expo Document Picker |
| Icons | Expo Vector Icons |

---

## 3. Project Structure

```
futureintern/
├── back/
│   └── futureintern-backend/
│       ├── app/
│       │   ├── __init__.py          # App factory, blueprint registration
│       │   ├── auth/                # Authentication & security
│       │   │   ├── routes.py        # Login, signup, refresh, 2FA
│       │   │   └── security_routes.py
│       │   ├── users/
│       │   │   └── routes.py        # Profile CRUD, resume upload
│       │   ├── internships/
│       │   │   └── routes.py        # Internship CRUD, save/unsave
│       │   ├── applications/
│       │   │   └── routes.py        # Apply, review, accept/reject
│       │   ├── matching/
│       │   │   ├── routes.py        # Recommendations endpoint
│       │   │   └── service.py       # TF-IDF matching engine
│       │   ├── cv/
│       │   │   └── routes.py        # CV CRUD, export, parse
│       │   ├── chatbot/
│       │   │   └── routes.py        # Hugging Face / OpenAI chat
│       │   ├── points/
│       │   │   └── routes.py        # Balance, transactions, store
│       │   ├── admin/
│       │   │   └── routes.py        # Stats, user mgmt, approvals
│       │   ├── notifications/
│       │   │   └── routes.py        # Expo push token registration
│       │   ├── models/              # SQLAlchemy ORM models
│       │   ├── utils/               # Helper functions
│       │   └── schemas/             # Marshmallow validation schemas
│       ├── config.py                # Configuration classes
│       ├── requirements.txt         # Python dependencies
│       ├── run.py                   # Entry point (python run.py)
│       └── futureintern.db          # SQLite dev database
│
├── front/
│   ├── src/
│   │   ├── pages/                   # Route-level page components
│   │   ├── components/              # Shared UI components
│   │   ├── context/                 # AuthContext, ThemeContext
│   │   ├── services/                # Axios/fetch API client
│   │   ├── utils/                   # Helpers
│   │   ├── types.ts                 # TypeScript interfaces
│   │   └── App.tsx                  # Root component, route definitions
│   ├── public/                      # Static assets, favicon, OG images
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/
│   ├── src/
│   │   ├── screens/                 # Screen components (Login, Home, etc.)
│   │   ├── components/              # Reusable components
│   │   ├── navigation/              # Navigation configuration
│   │   ├── context/                 # Auth & Theme contexts
│   │   ├── services/                # API client (mirrors backend)
│   │   └── types/                   # TypeScript interfaces
│   ├── App.tsx                      # Entry point
│   └── package.json
│
└── START-ALL.bat                    # Windows one-click dev startup
```

---

## 4. Database Models & Schemas

### Users

The single `users` table supports all three roles via a `role` discriminator field.

```
Column                  Type        Notes
─────────────────────────────────────────────────────────
id                      Integer     Primary key
name                    String      Full name
email                   String      Unique, required
password_hash           String      Werkzeug hashed (nullable for Google users)
role                    Enum        student | company | admin
google_id               String      OAuth subject ID (nullable)
auth_provider           String      local | google
points                  Integer     Current points balance (default: 0)
created_at              DateTime    Account creation time

── Student fields ──────────────────────────────────────
university              String
major                   String
skills                  Text        Comma-separated
interests               Text
bio                     Text
phone                   String
location                String
resume_url              String
profile_image           String
last_login_date         Date        For streak tracking
login_streak            Integer     Consecutive login days
email_verified          Boolean

── Company fields ──────────────────────────────────────
company_name            String
company_description     Text
company_website         String
company_location        String
is_verified             Boolean     Admin-verified flag

── Security fields ─────────────────────────────────────
failed_login_attempts   Integer     Resets on success
locked_until            DateTime    Set after 5 failed attempts
two_factor_enabled      Boolean
```

### Internships

```
Column                  Type        Notes
─────────────────────────────────────────────────────────
id                      Integer     Primary key
company_id              FK(users)   Posting company
title                   String
description             Text
requirements            Text
location                String
duration                String      e.g., "3 months"
stipend                 String
application_deadline    DateTime
start_date              DateTime
major                   String      Target major/field
required_skills         Text        Comma-separated
application_link        String      External apply link (optional)
is_active               Boolean     Auto-set false after deadline
created_at              DateTime
updated_at              DateTime
```

### Applications

```
Column                  Type        Notes
─────────────────────────────────────────────────────────
id                      Integer     Primary key
student_id              FK(users)
internship_id           FK(internships)
cover_letter            Text
resume_url              String
status                  Enum        pending | accepted | rejected | withdrawn
applied_at              DateTime
updated_at              DateTime
UNIQUE                              (student_id, internship_id)
```

### CV & CV Sections

```
── CV (one per student) ─────────────────────────────────
id, student_id (unique FK), headline, summary
phone, linkedin, github, website
created_at, updated_at

── CVSection ────────────────────────────────────────────
id, cv_id (FK)
section_type: education | experience | skills | projects | certifications | other
title, subtitle, location
start_date, end_date, description
order_index             Integer     For drag-and-drop reordering
created_at, updated_at
```

### Points & Transactions

```
── PointsTransaction ────────────────────────────────────
id, user_id (FK)
amount                  Integer     Positive (earn) or negative (spend)
balance_after           Integer     Snapshot after transaction
transaction_type        String      earn | spend | purchase | bonus
service_name            String      e.g., "cv_export", "chatbot"
description             Text
created_at              DateTime

── PointsPackage (Store items) ──────────────────────────
id, name, points, price (USD)
discount_percent        Integer
is_active               Boolean
description             Text

── ServicePricing (Configurable costs) ──────────────────
id, service_key (unique), display_name
points_cost             Integer
first_time_free         Boolean
is_active               Boolean

── PurchaseRequest ──────────────────────────────────────
id, user_id (FK), package_id (FK)
package_name, points, price
status: pending | approved | rejected
admin_note              Text
```

### Security Models

```
── TokenBlacklist ───────────────────────────────────────
id, jti (JWT ID), token_type
user_id (FK), created_at

── PasswordResetToken ───────────────────────────────────
id, user_id (FK), token_hash
created_at, expires_at (1 hour)

── EmailVerificationToken ───────────────────────────────
id, user_id (FK), token_hash
created_at, expires_at

── TwoFactorCode ────────────────────────────────────────
id, user_id (FK)
code                    String(6)   6-digit OTP
created_at, expires_at (10 minutes)
used                    Boolean

── UserPushToken (Mobile Notifications) ─────────────────
id, user_id (FK)
token                   String      Expo push token
platform                String      ios | android
created_at
```

### Other Models

```
SavedInternships        Many-to-many: users ↔ internships
AuditLog                Admin action tracking, security events
```

---

## 5. Authentication & Security

### Local Authentication Flow

```
1. POST /api/auth/signup
   → Validate email uniqueness
   → Hash password with Werkzeug pbkdf2:sha256
   → Create user record
   → Award 50 signup bonus points
   → Send verification email (if configured)
   → Return JWT access + refresh tokens

2. POST /api/auth/login
   → Look up user by email
   → Check account lockout (locked_until > now → 423)
   → Verify password hash
   → On failure: increment failed_login_attempts
     → 5 failures → set locked_until = now + 15 min
   → On success: reset failed_login_attempts
   → Check 2FA: if enabled → return {requires_2fa: true}
   → Update last_login_date, increment login_streak
   → Return JWT access + refresh tokens
```

### Token System

| Token | Expiry | Storage | Use |
|---|---|---|---|
| Access Token | 24 hours | Authorization header | API requests |
| Refresh Token | 30 days | localStorage / SecureStore | Obtain new access token |

- All protected routes use `@jwt_required()` decorator
- Tokens carry `user_id` and `role` in claims
- On logout: JWT ID (`jti`) is written to `TokenBlacklist` table
- Every request checks the blacklist to prevent use of revoked tokens
- `/api/auth/logout-all` blacklists all tokens for the user (all devices)

### Two-Factor Authentication (2FA)

```
Enable 2FA: PUT /api/auth/2fa/toggle {enabled: true}

Login with 2FA active:
1. POST /api/auth/login → {requires_2fa: true, temp_token: "..."}
2. POST /api/auth/2fa/send {temp_token} → sends 6-digit OTP via email
3. POST /api/auth/2fa/verify {temp_token, code} → returns full JWT tokens

OTP: 6 digits, 10-minute expiry, single-use
```

### Password Reset

```
1. POST /api/auth/forgot-password {email}
   → Generate secure random token
   → Hash and store in PasswordResetToken table
   → Send reset link via email (expires 1 hour)

2. POST /api/auth/reset-password {token, new_password}
   → Verify token hash
   → Check expiry
   → Validate password complexity
   → Update password hash
   → Invalidate all existing JWT tokens
```

### Security Controls

| Control | Detail |
|---|---|
| Account Lockout | 5 failed login attempts → 15-minute lock |
| Password Requirements | Min 8 chars, uppercase, number, special character |
| XSS Protection | `X-XSS-Protection: 1; mode=block` header |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` header |
| MIME Sniffing | `X-Content-Type-Options: nosniff` header |
| CORS | Whitelist of allowed origins, configured per environment |
| Rate Limiting | Applied to auth endpoints |
| HTTPS | Enforced in production via config |
| Audit Log | Admin actions and security events recorded |

---

## 6. Google OAuth Login

### How It Works

**Web Frontend**

1. The `@react-oauth/google` library renders a Google Sign-In button
2. User clicks → Google consent screen shown
3. On success, Google returns a **credential token** (JWT)
4. Frontend sends `POST /api/auth/google-login {credential: "<google_jwt>"}`
5. Backend verifies the Google JWT using Google's public keys
6. Finds or creates the user record:
   - New user: creates account with `auth_provider = "google"`, no password
   - Existing user: links `google_id` if not already linked
7. Awards signup bonus if new user
8. Returns FutureIntern JWT access + refresh tokens

**Mobile App**

1. Uses `expo-auth-session` with the Expo proxy for OAuth
2. Configured with `GOOGLE_CLIENT_ID` from environment
3. After consent, receives OAuth token
4. Exchanges token with backend via same `/api/auth/google-login` endpoint
5. Tokens stored in **Expo Secure Store** (encrypted native storage)

### Backend Verification

```python
# app/auth/routes.py — Google token verification
# 1. Decode Google credential JWT (RS256)
# 2. Verify audience matches GOOGLE_CLIENT_ID
# 3. Verify issuer is accounts.google.com
# 4. Extract: sub (google_id), email, name, picture
# 5. Upsert user in database
# 6. Issue FutureIntern tokens
```

### Configuration

```env
GOOGLE_CLIENT_ID=<your-oauth-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-oauth-secret>
```

Authorized JavaScript origins and redirect URIs must be configured in the [Google Cloud Console](https://console.cloud.google.com/) for both web and mobile.

---

## 7. User Profiles & Roles

### Role: Student

Students can:
- Browse and search internship listings
- Save favorite internships
- Apply to internships with cover letter + resume
- Build and export their CV
- Get AI-powered internship recommendations
- Chat with the career assistant chatbot
- Earn and spend points

### Role: Company

Companies can:
- Create, update, and delete internship postings
- Review applications for their internships
- Accept or reject applicants
- View applicant profiles (name, skills, university)
- Manage company profile (name, description, logo, website)

### Role: Admin

Admins can:
- View platform-wide statistics
- Manage all users (view, deactivate)
- Moderate internship postings
- Approve or reject points purchase requests
- Configure service pricing
- Test email configuration
- Access audit logs

### Profile Endpoints

```
GET  /api/users/me              Current authenticated user (all roles)
GET  /api/users/profile         Extended profile info
PUT  /api/users/profile         Update profile fields
POST /api/users/upload-resume   Upload PDF/DOCX file (returns URL)
GET  /api/users/<id>            Public profile of any user
GET  /api/users/search          Search users (admin only)
```

---

## 8. Internship Management

### Internship Lifecycle

```
Company creates internship
       ↓
[is_active = true]
       ↓
Students browse / search / save
       ↓
Application deadline passes → [is_active = false] (auto)
       ↓
Company reviews applications → accept / reject
```

### Filtering & Search

`GET /api/internships/` supports query parameters:
- `location` — Filter by city/country
- `skills` — Match required skills
- `major` — Filter by target major/field
- `page` + `per_page` — Pagination

### Saving Internships

Students can save internships to a personal list via `POST /api/internships/<id>/save` (toggles saved state). Saved list retrieved at `GET /api/internships/saved`.

### Endpoints

```
GET    /api/internships/          List all active (paginated, filterable)
GET    /api/internships/<id>      Internship details
POST   /api/internships/          Create new (company only)
PUT    /api/internships/<id>      Update (owner company only)
DELETE /api/internships/<id>      Delete (owner company only)
POST   /api/internships/<id>/save Toggle saved
GET    /api/internships/saved     List saved internships
```

---

## 9. Applications Workflow

### Status Flow

```
Student applies → [pending]
                      ↓
Company reviews: accept → [accepted]
                          or reject  → [rejected]
Student can: withdraw → [withdrawn] (any time before decision)
```

### Rules

- One application per student per internship (enforced by DB unique constraint)
- Only the student or the target company can view an application
- Company can only update status of applications to their own internships
- Application history persists even after status changes

### Endpoints

```
POST   /api/applications/apply         Student submits application
GET    /api/applications/              List (filtered by role: mine vs. to-me)
GET    /api/applications/mine          Student's own applications
GET    /api/applications/<id>          Details
PUT    /api/applications/<id>/status   Company accepts/rejects
DELETE /api/applications/<id>          Student withdraws
```

---

## 10. AI-Powered Matching & Recommendations

### Algorithm

The matching service (`app/matching/service.py`) implements a **Hybrid TF-IDF + Sentence-BERT (SBERT)** engine that scores every active internship against a student's profile using semantic similarity:

| Component | Weight | Method |
|---|---|---|
| Semantic similarity | 70% | SBERT `all-MiniLM-L6-v2` cosine similarity |
| Keyword similarity | 30% | TF-IDF cosine similarity (scikit-learn) |

**Fallback:** If `sentence-transformers` is unavailable or fails to load (e.g. OOM), the engine automatically falls back to 100% TF-IDF.

### Student Profile Inputs

The matcher builds a query string from all available student data:
- `skills` — listed skills
- `interests` — listed interests
- `bio` — profile bio
- `major` — field of study
- **CV Builder data** — headline, summary, and all section content (education, experience, projects, etc.)

### Internship Corpus Inputs

Each internship is represented as a combined text of: `title + description + required_skills + requirements`.

### Usage

```
GET /api/recommendations
Authorization: Bearer <token>

Returns:
{
  "recommendations": [
    {
      "score": 87.3,
      "internship": {
        "id": 12,
        "title": "Software Engineer Intern",
        "company": { "name": "Acme Corp", "profile_image": "..." },
        "location": "Cairo",
        ...
      },
      "match_details": {
        "tfidf_score": 65.2,
        "sbert_score": 97.1,
        "rank": 1
      }
    },
    ...
  ]
}
```

- Requires authentication (student only)
- **Charges 10 points per request** (no free trial)
- Returns top 10 matches by default (`?limit=N` to adjust)
- Requires at least one profile field (skills, interests, major, or bio) to be completed
- Service key: `ai_matching`

---

## 11. CV Builder

### Structure

A student's CV is stored as:
- One `CV` record (header: headline, summary, contact info)
- Multiple `CVSection` records (each section has a type, title, dates, description)

### Section Types

| Type | Use |
|---|---|
| `education` | Degrees, universities |
| `experience` | Work history, internships |
| `skills` | Technical and soft skills |
| `projects` | Personal or academic projects |
| `certifications` | Courses, certificates |
| `other` | Languages, awards, volunteering |

### Drag-and-Drop Reordering

Sections have an `order_index` field. The web frontend uses `@hello-pangea/dnd` to allow drag-and-drop reordering, which sends a PATCH request to update `order_index` values.

### PDF Export

`POST /api/cv/export` generates a polished PDF using **ReportLab** on the backend and returns it as a downloadable file.

- **Charges 5 points** (first time free)
- Layout includes name, contact row, sections with formatted dates

### Resume Parsing

`POST /api/cv/parse-resume` accepts a PDF or DOCX file upload and:
1. Extracts raw text (PyPDF2 for PDF, python-docx for DOCX)
2. Runs NLP keyword extraction to identify skills
3. Returns extracted skills list for the student to add to their profile

### Endpoints

```
GET    /api/cv/                   Get full CV (header + sections)
POST   /api/cv/                   Create or update CV header
POST   /api/cv/sections           Add a new section
PUT    /api/cv/sections/<id>      Update section content or order
DELETE /api/cv/sections/<id>      Remove section
POST   /api/cv/export             Generate and download PDF
POST   /api/cv/parse-resume       Extract skills from uploaded file
```

---

## 12. AI Chatbot

### Overview

The chatbot is a career guidance assistant accessible to all authenticated users. It is powered by a large language model and has context about the FutureIntern platform.

### Models & Fallback Chain

```
Primary:  Hugging Face Inference API
          Model: Qwen/Qwen2.5-7B-Instruct
          Provider: api-inference.huggingface.co

Fallback: OpenAI API
          Model: gpt-4o-mini
```

If the Hugging Face API is unavailable or returns an error, the system automatically falls back to OpenAI.

### System Prompt Context

The chatbot is instructed to act as a helpful career assistant for FutureIntern. It can:
- Give advice on internship applications
- Help with interview preparation
- Review cover letter content
- Suggest improvements to CV sections
- Answer questions about navigating the platform
- Respond in the same language the user writes in (English or Arabic)

### Conversation History

Message history is tracked per session to provide context-aware responses. The backend maintains the last N messages to keep the context window manageable.

### Points Cost

- Default: **1 point per message**
- No free first message
- Configurable via `ServicePricing` table (`service_key = "chatbot"`)

### Endpoints

```
GET  /api/chatbot/       Service index / health
POST /api/chatbot/chat   Send message, receive AI response
GET  /api/chatbot/status Model availability status
```

**Request:**
```json
POST /api/chatbot/chat
{
  "message": "How do I write a good cover letter?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Response:**
```json
{
  "reply": "A strong cover letter should...",
  "points_charged": 1,
  "points_remaining": 49
}
```

---

## 13. Points & Rewards System

The points system gamifies the platform, rewarding engagement and gating access to premium AI features.

### Earning Points

| Event | Points Awarded |
|---|---|
| Account signup | +50 |
| Daily login | +5 (base), scales with streak |
| Streak bonuses | +5 (3-day), +15 (7-day), +25 (14-day), +50 (30-day) |
| Submitting an application | +3 |
| Profile completion | +5 per new field filled (tracked fields: university, major, skills, interests, bio, location) |

### Operation Costs (Spending Points)

Every premium operation deducts points from the user's balance. Costs are configurable by admins via the `ServicePricing` table.

| Operation | Points Cost | First-Time Free? | Service Key |
|---|---|---|---|
| AI Internship Recommendations | **10 pts** | ❌ No | `ai_matching` |
| CV PDF Export | **15 pts** | ✅ Yes | `cv_export` |
| AI Chatbot Message | **1 pt per message** | ❌ No | `chatbot` |
| CV Section Add | **3 pts** | ✅ Yes (first section) | `cv_section_add` |

> **How deduction works:** When a student triggers a paid operation, the backend calls `check_and_charge(user, service_key)`. It looks up the `ServicePricing` row, checks `first_time_free` against past `PointsTransaction` records, then either charges and records the transaction or returns a 402 error if the balance is insufficient.

### Purchasing Points

Students can buy point packages directly from the in-app **Points Store**. The purchase flow requires **admin approval** before points are credited:

#### Available Packages (in-store)

```
GET /api/points/store
```

Returns a list of active `PointsPackage` records, e.g.:

| Package | Points | Price (USD) | Discount |
|---|---|---|---|
| Starter Pack | 50 pts | $2.99 | — |
| Standard Pack | 150 pts | $7.99 | 10% off |
| Premium Pack | 500 pts | $19.99 | 20% off |
| Ultimate Pack | 1,200 pts | $39.99 | 30% off |

#### Purchase Request Flow

```
1. Student selects a package from the store
         ↓
2. POST /api/points/purchase  {package_id: <id>}
   → Creates PurchaseRequest [status: pending]
   → Student is instructed to complete external payment
         ↓
3. Student makes payment externally (bank transfer, etc.)
         ↓
4. Admin receives notification of pending purchase
         ↓
5. Admin verifies payment manually (external)
         ↓
6. Admin approves or rejects via dashboard:
   POST /api/admin/points/approve  {request_id, admin_note}
   POST /api/admin/points/reject   {request_id, admin_note}
         ↓
7. On approval:
   → user.points += package.points
   → PurchaseRequest.status = "approved"
   → PointsTransaction created (type: "purchase")
   → Confirmation email sent to student
   → Push notification sent (mobile): "Your points have been credited"
         ↓
8. On rejection:
   → PurchaseRequest.status = "rejected"
   → Rejection email sent to student with admin_note reason
```

#### Purchase Request States

| Status | Meaning |
|---|---|
| `pending` | Awaiting admin review |
| `approved` | Payment verified — points credited |
| `rejected` | Payment not verified — no points granted |

### Admin Approval Workflow

Admins manage all point purchase requests from the **Admin Dashboard** under the **Points Management** section.

#### Endpoints

```
GET  /api/admin/points/requests        List all pending purchase requests
POST /api/admin/points/approve         Approve a request & credit points
POST /api/admin/points/reject          Reject a request with a reason
```

#### Approve Request

```http
POST /api/admin/points/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "request_id": 12,
  "admin_note": "Payment confirmed via bank transfer ref #TXN-4892"
}
```

**Response:**
```json
{
  "message": "Purchase approved. 300 points credited to user.",
  "user_id": 45,
  "points_added": 300,
  "new_balance": 350
}
```

#### Reject Request

```http
POST /api/admin/points/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "request_id": 13,
  "admin_note": "Payment not received within 48 hours. Please retry."
}
```

**Response:**
```json
{
  "message": "Purchase request rejected.",
  "request_id": 13
}
```

### Points API

```
GET  /api/points/balance        Current balance
GET  /api/points/transactions   Full transaction history (paginated)
GET  /api/points/store          Available purchase packages
POST /api/points/purchase       Request a package purchase
```

### Transaction Record

Every point change creates a `PointsTransaction` record:
```json
{
  "id": 42,
  "amount": -10,
  "balance_after": 40,
  "transaction_type": "service_charge",
  "service_name": "ai_matching",
  "description": "Used AI Internship Matching",
  "created_at": "2026-04-22T12:00:00Z"
}
```

---

## 14. Admin Dashboard

### Access

All `/api/admin/*` routes require `role = admin` in the JWT claims. Non-admin requests receive `403 Forbidden`.

### Features

| Feature | Endpoint |
|---|---|
| Platform statistics | `GET /api/admin/stats` |
| User management | `GET /api/admin/users` |
| Application overview | `GET /api/admin/applications` |
| Approve points purchase | `POST /api/admin/points/approve` |
| Reject points purchase | `POST /api/admin/points/reject` |
| Test email configuration | `POST /api/admin/test-email` |

### Statistics Response

```json
{
  "total_users": 1240,
  "students": 1050,
  "companies": 188,
  "total_internships": 320,
  "active_internships": 145,
  "total_applications": 4800,
  "pending_applications": 320,
  "pending_purchases": 5
}
```

### Points Purchase Approval Flow

```
Student purchases package → PurchaseRequest [pending]
       ↓
Admin reviews payment (external)
       ↓
POST /api/admin/points/approve {request_id, admin_note}
  → Credits points to user
  → Updates PurchaseRequest [approved]
  → Sends confirmation email to user
```

---

## 15. Push Notifications

Push notifications are delivered to mobile users via the **Expo Push Notification** service.

### Token Registration

When a user grants notification permission on mobile:
```
POST /api/notifications/register
{
  "token": "ExponentPushToken[xxxxxx]",
  "platform": "android"
}
```

Tokens are stored in `UserPushToken` table, linked to the user.

### Unregistration

```
POST /api/notifications/unregister
{
  "token": "ExponentPushToken[xxxxxx]"
}
```

### Use Cases

| Event | Notification |
|---|---|
| Application status changed | "Your application was accepted!" |
| New internship matching profile | "New internship available for you" |
| Points purchase approved | "Your points have been credited" |

---

## 16. Email System

### Multi-Provider Architecture

The backend tries each provider in order until one succeeds:

```
1. Mailjet       → 200 emails/day free, no domain required
2. Brevo         → 300 emails/day free
3. Resend        → HTTP API, works on Railway
4. SMTP Fallback → Gmail or custom SMTP server
```

This ensures email delivery even if one provider is down or rate-limited.

### Email Use Cases

| Use Case | Trigger |
|---|---|
| Password reset | `POST /api/auth/forgot-password` |
| 2FA OTP code | `POST /api/auth/2fa/send` |
| Email verification | On signup |
| Application accepted | Status change |
| Points purchase approved | Admin action |

### Configuration

```env
# Mailjet
MAILJET_API_KEY=xxx
MAILJET_SECRET_KEY=xxx

# Brevo
BREVO_API_KEY=xxx

# Resend
RESEND_API_KEY=xxx

# SMTP Fallback
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=app-specific-password

MAIL_DEFAULT_SENDER=noreply@futureintern.com
```

---

## 17. Mobile App

### Screens

| Screen | Description |
|---|---|
| Login | Email/password + Google OAuth |
| Signup | Registration with role selection |
| Home | Dashboard with stats and recent activity |
| Browse | Internship listing with search & filters |
| Internship Detail | Full listing + apply button |
| My Applications | Application list with status badges |
| CV Builder | Edit CV sections with section picker |
| Chatbot | Chat interface with AI assistant |
| Points | Balance, history, and store |
| Profile | View and edit student/company profile |
| Notifications | In-app notification list |

### Navigation Structure

```
Root Stack
├── Auth Stack (unauthenticated)
│   ├── Login
│   └── Signup
└── Main Bottom Tabs (authenticated)
    ├── Home Tab
    ├── Browse Tab
    ├── CV Tab (students)
    ├── Chatbot Tab
    └── Profile Tab
```

### Authentication Storage

- JWT access token: `Expo Secure Store` (encrypted)
- JWT refresh token: `Expo Secure Store` (encrypted)
- User data cache: `AsyncStorage`

### Google OAuth on Mobile

Uses `expo-auth-session` with the Expo OAuth proxy for development. In production, direct redirect URIs configured in Google Cloud Console are used.

### Push Notifications

1. App requests permission on first launch
2. Gets Expo push token via `Notifications.getExpoPushTokenAsync()`
3. Registers token with backend on login
4. Background notification handler updates app badge/state

---

## 18. Web Frontend

### Pages

| Route | Page | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/login` | Login form | Public |
| `/signup` | Registration | Public |
| `/dashboard` | Student dashboard | Student |
| `/internships` | Browse internships | Student |
| `/internships/:id` | Internship detail | Student |
| `/applications` | My applications | Student |
| `/cv-builder` | CV editor | Student |
| `/chatbot` | Chat interface | Student |
| `/points` | Points wallet | Student |
| `/profile` | Profile editor | All |
| `/company/dashboard` | Company dashboard | Company |
| `/company/internships` | Manage internships | Company |
| `/company/applications` | Review applications | Company |
| `/admin` | Admin panel | Admin |

### State Management

- **AuthContext**: Stores current user, tokens, login/logout functions
- **ThemeContext**: Dark/light mode preference
- React Router handles navigation and protected route guards

### API Client

A centralized service layer in `src/services/` wraps all backend calls, automatically attaching the Authorization header and handling token refresh on 401 responses.

---

## 19. API Reference

### Base URL

| Environment | URL |
|---|---|
| Development | `http://localhost:5000` |
| Production | `https://<your-railway-app>.up.railway.app` |

### Authentication Header

```
Authorization: Bearer <access_token>
```

### Full Endpoint List

#### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | No | Register new user |
| POST | `/login` | No | Login, get tokens |
| POST | `/refresh` | Refresh token | Get new access token |
| POST | `/logout` | Yes | Revoke current token |
| POST | `/logout-all` | Yes | Revoke all tokens |
| POST | `/forgot-password` | No | Send reset email |
| POST | `/reset-password` | No | Reset with token |
| POST | `/2fa/send` | Temp token | Send OTP |
| POST | `/2fa/verify` | Temp token | Verify OTP, get tokens |
| PUT | `/2fa/toggle` | Yes | Enable / disable 2FA |
| POST | `/google-login` | No | Login via Google credential |

#### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | Yes | Current user |
| GET | `/profile` | Yes | Extended profile |
| PUT | `/profile` | Yes | Update profile |
| POST | `/upload-resume` | Yes | Upload CV file |
| GET | `/<id>` | Yes | Get user by ID |
| GET | `/search` | Admin | Search users |

#### Internships — `/api/internships`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Optional | List internships |
| GET | `/<id>` | Optional | Internship detail |
| POST | `/` | Company | Create internship |
| PUT | `/<id>` | Company | Update internship |
| DELETE | `/<id>` | Company | Delete internship |
| POST | `/<id>/save` | Student | Toggle saved |
| GET | `/saved` | Student | Saved internships |

#### Applications — `/api/applications`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/apply` | Student | Submit application |
| GET | `/` | Yes | List (role-filtered) |
| GET | `/mine` | Student | My applications |
| GET | `/<id>` | Yes | Application detail |
| PUT | `/<id>/status` | Company | Accept / reject |
| DELETE | `/<id>` | Student | Withdraw |

#### Matching — `/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/recommendations` | Student | AI recommendations |

#### CV — `/api/cv`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Student | Full CV |
| POST | `/` | Student | Create / update header |
| POST | `/sections` | Student | Add section |
| PUT | `/sections/<id>` | Student | Update section |
| DELETE | `/sections/<id>` | Student | Delete section |
| POST | `/export` | Student | Export PDF |
| POST | `/parse-resume` | Student | Extract skills from file |

#### Chatbot — `/api/chatbot`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Index |
| POST | `/chat` | Yes | Send message |
| GET | `/status` | No | Model status |

#### Points — `/api/points`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/balance` | Yes | Current balance |
| GET | `/transactions` | Yes | History |
| GET | `/store` | Yes | Packages |
| POST | `/purchase` | Yes | Buy package |

#### Admin — `/api/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stats` | Admin | Dashboard stats |
| GET | `/users` | Admin | User list |
| GET | `/applications` | Admin | Application list |
| POST | `/points/approve` | Admin | Approve purchase |
| POST | `/points/reject` | Admin | Reject purchase |
| POST | `/test-email` | Admin | Test email |

#### Notifications — `/api/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Yes | Register push token |
| POST | `/unregister` | Yes | Remove push token |

---

## 20. Configuration & Environment Variables

### Backend `.env`

```env
# ── Core ──────────────────────────────────────────────
FLASK_ENV=production                    # development | production
FLASK_DEBUG=0                           # 0 in production
PORT=5000                               # Server port
SECRET_KEY=<random-64-char-string>      # Flask session key

# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/futureintern
# SQLite for dev: sqlite:///futureintern.db

# ── JWT ───────────────────────────────────────────────
JWT_SECRET_KEY=<random-64-char-string>  # Different from SECRET_KEY
# Access token: 24h, Refresh token: 30d (hardcoded in config.py)

# ── CORS ──────────────────────────────────────────────
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-domain.com

# ── Google OAuth ──────────────────────────────────────
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# ── AI / Chatbot ──────────────────────────────────────
HUGGINGFACE_API_KEY=hf_xxx
HUGGINGFACE_MODEL=Qwen/Qwen2.5-7B-Instruct
OPENAI_API_KEY=sk-xxx                   # Optional fallback

# ── Email ─────────────────────────────────────────────
MAIL_DEFAULT_SENDER=noreply@futureintern.com

MAILJET_API_KEY=xxx
MAILJET_SECRET_KEY=xxx

BREVO_API_KEY=xxx

RESEND_API_KEY=xxx

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-app-password

# ── Security ──────────────────────────────────────────
MIN_PASSWORD_LENGTH=8
REQUIRE_PASSWORD_COMPLEXITY=true
MAX_CONTENT_LENGTH=5242880              # 5 MB file upload limit
```

### Frontend `.env`

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Mobile `.env` / `app.config.js`

```js
EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 21. Deployment

### Backend — Railway

1. Connect GitHub repo to Railway
2. Set all environment variables from Section 20
3. Railway uses the `Dockerfile` in `back/futureintern-backend/`
   - Installs CPU-only PyTorch first (to stay under the 4 GB image limit)
   - Then installs `requirements.txt` (includes `sentence-transformers`)
4. The container starts via `start.sh` which runs:
   ```
   gunicorn -w 2 -b 0.0.0.0:$PORT --timeout 120 run:app
   ```
   (2 workers to fit within Railway's 512 MB free-tier RAM alongside SBERT ~400 MB)
5. Set `DATABASE_URL` to a Railway PostgreSQL addon
6. Railway injects `PORT` automatically

### Frontend — Vercel

1. Connect `front/` directory to Vercel
2. Set `VITE_API_BASE_URL` in Vercel environment variables
3. Build command: `npm run build`
4. Output directory: `dist`

### Mobile — Expo

**Development:**
```bash
cd mobile
npx expo start
```

**Production build:**
```bash
npx eas build --platform android  # or ios
npx eas submit                     # Submit to app stores
```

### Local Development (Windows)

Run `START-ALL.bat` in the project root to launch:
1. Backend Flask server on `localhost:5000`
2. Frontend Vite dev server on `localhost:5173`
3. Mobile Expo dev server

**Manual startup:**
```bash
# Backend
cd back/futureintern-backend
pip install -r requirements.txt
python run.py

# Frontend
cd front
npm install
npm run dev

# Mobile
cd mobile
npm install
npx expo start
```

### API Documentation

Swagger UI is available at:
```
http://localhost:5000/apidocs
```


