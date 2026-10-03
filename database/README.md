# 🗄️ Digi Law Reporter — Database Folder

This directory contains all PostgreSQL database SQL migrations, schema definitions, indexing rules, and seed scripts.

---

## 📁 Directory Layout

```
database/
├── schema/
│   ├── 001_create_admins_table.sql        # Admins table & RBAC role checks
│   ├── 002_create_users_table.sql         # Portal subscriber users table
│   ├── 003_create_cases_table.sql         # Precedents, judgments & JSONB DLR citations
│   └── 004_full_text_search_index.sql     # GIN Index on TSVECTOR for sub-second search
├── seed/
│   └── seed_data.sql                      # Seed initial admins, portal users & sample cases
├── setup_database.js                      # Automated Node.js execution script
└── README.md
```

---

## ⚡ How to Initialize PostgreSQL Database

### Option 1: Automated Script (Node.js)
Ensure PostgreSQL is running locally, then run:

```bash
node database/setup_database.js
```

### Option 2: Manual PostgreSQL Command Line (psql)
```bash
psql -U postgres -d digi_law_reporter -f database/schema/001_create_admins_table.sql
psql -U postgres -d digi_law_reporter -f database/schema/002_create_users_table.sql
psql -U postgres -d digi_law_reporter -f database/schema/003_create_cases_table.sql
psql -U postgres -d digi_law_reporter -f database/schema/004_full_text_search_index.sql
psql -U postgres -d digi_law_reporter -f database/seed/seed_data.sql
```
