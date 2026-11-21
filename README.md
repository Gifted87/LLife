# 🌿 LLife — Personal Life & Health Records Management System

[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express / Native HTTP](https://img.shields.io/badge/Backend-Node%20HTTP%20%2F%20Serverless-000000?style=for-the-badge&logo=express&logoColor=white)](https://nodejs.org/)
[![SQLite Engine](https://img.shields.io/badge/Database-SQLite%20(node%3Asqlite)-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Frontend Tech](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel%20Serverless%20Ready-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

> A modern, zero-dependency, ultra-lightweight Personal Life and Health Records Management platform built for speed, resiliency, and flexibility. Features an interactive dashboard, secure administrative gate, dual-layer storage (Native SQLite with JSON fallback), and seamless serverless hosting on Vercel.

---

## 📖 Overview

**LLife** (Personal Records Management System) provides an all-in-one, responsive solution for tracking, cataloging, and managing personal entries, lifestyle milestones, health metrics, and user submissions. Engineered with zero external runtime dependencies using pure Node.js native libraries (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`), LLife delivers instant startup times, rock-solid data integrity, and effortless portability between local workstations and serverless cloud edge environments.

---

## ✨ Core Features

- ⚡ **Zero-Dependency Native Architecture**: Built entirely on standard Node.js APIs (`node:http`, `node:sqlite`, `node:crypto`). No bloated node_modules trees, fast vulnerability-free execution.
- 💾 **Dual-Mode Resilient Database Layer**:
  - **Primary**: Native Node.js embedded SQLite engine (`node:sqlite`) for lightning-fast queries and transactions.
  - **Fallback**: Graceful fallback to flat-file JSON serialization when running in ephemeral or restricted serverless containers.
- 📊 **Responsive Analytics & Records Dashboard**:
  - Real-time KPI summary widgets (total record count, latest user/entry, time indicators).
  - Live client-side instant search and filtering.
  - Paginated table rendering with expandable details and individual/bulk record deletion.
  - Status indicator displaying live connection health with the database engine.
- 🔐 **Secure Admin Gate & Session Tokenization**:
  - Password-protected administrative view with SHA-256 token authorization.
  - Bearer token & `x-admin-token` header validation on sensitive API endpoints.
  - Automatic session timeout and lock management.
- 🚀 **Vercel & Cloud Edge Deployment Ready**:
  - Pre-configured `vercel.json` routing rules and rewrite configurations.
  - Serverless functions split under `/api` (`records.js`, `admin-auth.js`).
  - Ephemeral directory (`os.tmpdir()`) adaptation for serverless writable storage.
- 📱 **Mobile-First Responsive UI**:
  - Elegant glassmorphism visual styling, responsive grid layouts, and custom-crafted SVG icon vectors.
  - Designed with accessibility, dark/light contrast harmony, and fluid typography.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------+
|                             Client Layer                              |
|   - index.html (Capture & Entry View)                                 |
|   - records.html (Admin Management Dashboard & KPI Widgets)          |
|   - records.js (Live Search, State Management, Admin Session)         |
+------------------------------------+----------------------------------+
                                     |
                                     | HTTP REST API (Fetch / CORS)
                                     v
+------------------------------------+----------------------------------+
|                            Backend Layer                              |
|   Local: server.js (Node.js HTTP Server, Router, MIME Dispatcher)     |
|   Cloud: Vercel Serverless Functions (/api/records, /api/admin-auth)  |
+------------------------------------+----------------------------------+
                                     |
                                     v
+------------------------------------+----------------------------------+
|                          Data Access Layer                            |
|                                db.js                                  |
|   - Auto-detection: node:sqlite vs. Flat JSON                         |
|   - Path Resolution: Local Root (data.sqlite) vs. /tmp (Vercel)       |
+------------------------------------+----------------------------------+
           |                                            |
           v                                            v
+-----------------------+                    +-----------------------+
|  SQLite Storage File  |                    |   JSON Fallback File  |
|     (data.sqlite)     |                    |      (data.json)      |
+-----------------------+                    +-----------------------+
```

---

## 📁 Project Structure

```
LLife/
├── .env                  # Local environment configuration (gitignored)
├── .env.example          # Template environment variable definitions
├── .gitignore            # Git exclusion rules
├── api/                  # Vercel Serverless Function Endpoints
│   ├── admin-auth.js     # Admin password verification & token generator
│   └── records.js        # RESTful API for records (GET, POST, DELETE)
├── data.sqlite           # Local SQLite database (auto-generated)
├── db.js                 # Abstraction layer supporting SQLite & JSON fallback
├── DEPLOY_VERCEL.md      # Detailed Vercel deployment walkthrough
├── index.html            # Public landing & record submission interface
├── package.json          # Node.js project manifest & scripts
├── public/               # Static web distribution assets
│   ├── index.html        # Public entry page
│   ├── records.html      # Records administration page
│   ├── records.css       # Admin dashboard styles
│   ├── records.js        # Admin client-side logic
│   ├── script.js         # Landing page interactions
│   └── styles.css        # Core typography and UI layout styles
├── records.css           # Root records styling
├── records.html          # Root administrative dashboard interface
├── records.js            # Root dashboard controller logic
├── script.js             # Root client-side interactions
├── server.js             # Standalone Node.js native HTTP server
├── styles.css            # Root master stylesheet
└── vercel.json           # Vercel routing rewrites, CORS, and build setup
```

---

## 🛠️ Prerequisites

Before running the application locally, ensure you have:

- **Node.js**: `v18.0.0` or higher (`v20+` or `v22+` recommended for built-in `node:sqlite` support).
- **npm**: `v9.0.0` or higher (bundled with Node.js).
- **Modern Web Browser**: Chrome, Firefox, Safari, Edge, or Brave.

---

## 🚀 Installation & Local Running

### 1. Clone the Repository
```bash
git clone https://github.com/Gifted87/LLife.git
cd LLife
```

### 2. Environment Configuration
Copy the template configuration file and define your administrator secret:

```bash
# On Linux / macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

Edit `.env` to customize your variables:
```env
# Administrator credential for unlocking records dashboard
ADMIN_PASSWORD=your_secure_password_here

# Local HTTP server port
PORT=3001
```

### 3. Start the Server

No heavy dependencies to download! Run the application directly:

```bash
# Start local server
npm start

# Or run with Node 20+ live watch mode
npm run dev

# Or directly with node
node server.js
```

Once started, the console will display:
```
[DB] Using SQLite database at: C:\...\LLife\data.sqlite
[Server] Lagos Life running at: http://localhost:3001
[Server] Admin Dashboard:       http://localhost:3001/records.html
[Server] JSON API:              http://localhost:3001/api/records
```

### 4. Access the Application
- **User Entry Portal**: Open [http://localhost:3001](http://localhost:3001) in your browser.
- **Admin Dashboard**: Open [http://localhost:3001/records.html](http://localhost:3001/records.html) (or `/admin` when deployed).

---

## 🔌 API Reference

All API endpoints support cross-origin requests (CORS) and return standard JSON responses.

### 1. Public Submission
Save a new record entry into the database.

- **URL**: `/api/records` (or `/api/login`)
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "input1": "John Doe",
    "input2": "Heart Rate: 72 bpm, Blood Pressure: 120/80"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Saved to database successfully!",
    "driver": "sqlite"
  }
  ```

---

### 2. Administrator Authentication
Verify administrative access and receive a SHA-256 session token.

- **URL**: `/api/admin-auth`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "password": "your_admin_password_here"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "token": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "message": "Admin authenticated successfully."
  }
  ```

---

### 3. List All Records (Protected)
Fetch all stored records in reverse chronological order.

- **URL**: `/api/records`
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer <ADMIN_TOKEN>` *or* `x-admin-token: <ADMIN_TOKEN>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 2,
    "driver": "sqlite",
    "records": [
      {
        "id": 2,
        "input1": "Jane Smith",
        "input2": "Daily steps: 11,400",
        "created_at": "2026-11-21 11:45:00"
      },
      {
        "id": 1,
        "input1": "John Doe",
        "input2": "Heart Rate: 72 bpm",
        "created_at": "2026-11-21 10:15:00"
      }
    ]
  }
  ```

---

### 4. Delete Record(s) (Protected)
Remove a specific entry by ID, or wipe all records.

- **URL**: `/api/records?id=:id` (Single delete) or `/api/records` (Clear all)
- **Method**: `DELETE`
- **Headers**:
  - `Authorization: Bearer <ADMIN_TOKEN>` *or* `x-admin-token: <ADMIN_TOKEN>`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Record #2 deleted."
  }
  ```

---

## ☁️ Deployment Guide (Vercel)

The repository is fully configured for deployment on **[Vercel](https://vercel.com)** out of the box using Serverless Functions and Edge CDN.

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally (if not installed)
npm install -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Option B: Deploy via GitHub Continuous Deployment (Recommended)

1. Ensure all changes are committed and pushed to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Navigate to [vercel.com/new](https://vercel.com/new).
3. Import the `LLife` repository from your GitHub account.
4. Under **Environment Variables**, add:
   - `ADMIN_PASSWORD`: Your secret administrator dashboard password.
5. Click **Deploy**. Vercel will build and provision:
   - Static HTML/CSS/JS files via the Vercel Global Edge Network.
   - Dynamic `/api/records` and `/api/admin-auth` serverless endpoints.
   - Clean route rewrites (`/records` -> `/records.html`, `/admin` -> `/records.html`).

> [!NOTE]
> Serverless function execution containers have a read-only root filesystem. The included `db.js` layer automatically routes SQLite and JSON storage to `os.tmpdir()` when executing within Vercel. For distributed, persistent multi-region cloud scaling, connect to a serverless database such as [Turso](https://turso.tech) (libSQL) or [Neon / Vercel Postgres](https://vercel.com/storage/postgres).

---

## 🤝 Contributing

Contributions, feedback, and enhancements are always welcome!

1. Fork the Project (`https://github.com/Gifted87/LLife/fork`)
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m "feat: add NewFeature"`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Crafted with care for clean, resilient, and lightweight personal records tracking.
</p>
