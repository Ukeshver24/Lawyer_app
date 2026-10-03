# 🏛️ Digi Law Reporter (DLR)

Digi Law Reporter is an advanced legal research portal and administrative publishing system designed for the legal community (Advocates on Record, Senior Counsel, law firms, judiciary, and law students).

---

## 📌 Development Focus & Scope

| Module | Technology | Status | Notes |
| :--- | :--- | :---: | :--- |
| **`frontend/`** | React 19, Vite, Tailwind CSS, Tiptap | 🟢 **ACTIVE** | Main Web Research Portal & Admin Dashboard |
| **`backend/`** | Express.js, PostgreSQL (Direct DB only) | 🟢 **ACTIVE** | Core RESTful API & DB persistence |
| **`database/`** | PostgreSQL 18+, GIN Index, TSVECTOR | 🟢 **ACTIVE** | SQL migrations & full-text indexing |
| **`mobile/`** | Flutter 3.x (iOS & Android) | ❄️ **FROZEN** | Locked. No new updates; preserved as-is. |

---

## 🚀 Quick Start (Website & Backend)

### 1. Database Setup
Ensure PostgreSQL is running locally on port 5432, then initialize the database:
```bash
cd backend
npm run setup:db
```

### 2. Run Backend API (Port 5000)
```bash
cd backend
npm start
```

### 3. Run Frontend Web Application (Port 5173)
```bash
cd frontend
npm run dev
```

---

## 🔒 Mobile Code Freeze Policy
The `mobile/` directory is **frozen**. All updates, redesigns, new features, and integrations are to be implemented exclusively on the web application (`frontend/`).
