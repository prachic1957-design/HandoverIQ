# HandoverIQ

> **Tagline:** Preserve Knowledge. Power Continuity.  
> **Team:** ROGUENOVA  
> **Project:** AI-Powered Employee Knowledge Handover & Replacement Management System  

---

## 📌 Executive Summary

**HandoverIQ** is an enterprise knowledge retention platform engineered to prevent institutional knowledge loss when employees transition or depart. 

The system collects authorized employee-specific project information, reconstructs work history with verifiable evidence, supports human verification, and prepares tailored Day-1 briefings for successor employees.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, Multer |
| **Document Processing** | `pdf-parse` (Page extraction), `mammoth` (DOCX), Text & CSV parsing |
| **Database & Storage** | Supabase (PostgreSQL) & Supabase Storage (`handover-documents` private bucket) |
| **Artificial Intelligence** | Google Gemini API (Structured Work History & Milestones — Phase 4) |
| **Design System** | Dark Navy (`#0B1020`), Deep Blue (`#14213D`), Electric Blue (`#3B82F6`) |

---

## 🧭 Complete Handover Lifecycle Pipeline

```
Company 
  └── Departments (IT, HR, Finance, Marketing, Operations)
        └── Employees (HR-isolated salary privacy)
              └── Projects (Responsibilities & milestones)
                    └── Knowledge Upload (PDF, DOCX, TXT, CSV) ◄── [Phase 3 Completed]
                          └── AI Reconstruction (Milestones, risks, blockers)
                                └── Evidence-Linked Report (Source-cited claims)
                                      └── Human Review (Employee amendments)
                                            └── Manager Approval (Sign-off)
                                                  └── Replacement Selection
                                                        └── AI Briefing (Day-1 readiness)
                                                              └── Work Continuity
```

---

## 🗄️ Database Architecture & Supabase Setup

### 1. Database Schema
HandoverIQ manages relational entity tables with strict primary/foreign keys, uniqueness constraints, and indexes:

- `departments`: Core organizational units (`id`, `name`, `description`, `created_at`)
- `employees`: Staff profiles with role assignments (`id`, `full_name`, `email`, `designation`, `department_id`, `joining_date`, `employment_status`, `salary`, `created_at`)
- `projects`: Monitored initiatives (`id`, `name`, `description`, `status`, `start_date`, `end_date`, `created_at`)
- `project_members`: Specific team member assignments with ownership responsibilities and work statuses (`id`, `project_id`, `employee_id`, `responsibility`, `work_status`, `created_at`)
- `documents`: Ingested technical files with metadata and processing status (`id`, `project_id`, `employee_id`, `original_filename`, `storage_path`, `mime_type`, `file_size`, `file_hash`, `extracted_text`, `processing_status`, `processing_error`, `uploaded_at`)
- `document_chunks`: Granular text chunks with strict page/section source coordinates (`id`, `document_id`, `chunk_index`, `extracted_content`, `page_number`, `section_reference`, `created_at`)

### 2. Migration Execution Instructions

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to **SQL Editor**.
2. Run migration **[supabase/migrations/20261112000000_create_core_schema.sql](file:///d:/AI-Powered%20Employee%20Knowledge%20Handover%20&%20Replacement%20Management%20System/supabase/migrations/20261112000000_create_core_schema.sql)**.
   - Creates `departments`, `employees`, `projects`, `project_members`.
   - Activates Row Level Security (RLS) policies and performance indexes.
   - Configures the `public_employees` view which omits confidential compensation data.
3. Run seed migration **[supabase/migrations/20261112000001_seed_demo_data.sql](file:///d:/AI-Powered%20Employee%20Knowledge%20Handover%20&%20Replacement%20Management%20System/supabase/migrations/20261112000001_seed_demo_data.sql)**.
   - Idempotently populates 3 departments (IT, HR, Finance), 5 employees, 2 enterprise projects, and mapped member responsibilities (`ON CONFLICT DO NOTHING`).
4. Run migration **[supabase/migrations/20261112000002_create_documents_schema.sql](file:///d:/AI-Powered%20Employee%20Knowledge%20Handover%20&%20Replacement%20Management%20System/supabase/migrations/20261112000002_create_documents_schema.sql)**.
   - Creates private Supabase Storage bucket `handover-documents`.
   - Creates `documents` and `document_chunks` tables with integrity indexes and foreign keys.

---

## 📄 Supported Document Formats & Text Extraction

| Format | Extension | Text Extraction Strategy | Source Reference Coordinates |
|---|---|---|---|
| **Portable Document Format** | `.pdf` | Multi-page text extraction via `pdf-parse` (detects scanned/empty PDFs & flags `needs_ocr`) | Exact Page Numbers (`Page 1`, `Page 2`, ...) |
| **Word Document** | `.docx` | Semantic raw text extraction via `mammoth` | Document Section & Paragraph Coordinates |
| **Plain Text** | `.txt` | UTF-8 decoded stream chunking with sentence overlap | Section / Paragraph References |
| **Structured CSV** | `.csv` | Row-and-column schema preserving header context | Row Coordinates (`Rows 1-5`, `Rows 6-10`, ...) |

---

## 📡 REST API Reference

### Health & Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and service connectivity health monitor |
| `GET` | `/api/dashboard/stats` | Real-time counts (departments, employees, projects, active handovers, documents) |

### Knowledge Ingestion (Phase 3)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Multipart upload with text extraction, chunking, and SHA-256 duplicate detection |
| `GET` | `/api/documents` | List ingested documents (supports `?project_id=`, `?employee_id=`, `?search=`) |
| `GET` | `/api/documents/:id` | Get document metadata and extracted text preview |
| `GET` | `/api/documents/:id/chunks` | Get source-linked text chunks with page/row coordinates |
| `GET` | `/api/documents/:id/download` | Securely stream and download original uploaded file |
| `DELETE`| `/api/documents/:id` | Permanently delete file from storage and remove chunks |
| `GET` | `/api/projects/:id/documents`| Retrieve all documentation linked to a specific project |

### Departments, Employees & Projects (Phase 2)
- `/api/departments` — Full CRUD for organizational units
- `/api/employees` — Full CRUD with confidential salary RBAC
- `/api/projects` — Full CRUD for monitored projects
- `/api/projects/:id/members` — Project member assignments with specific ownership responsibilities

---

## 🚀 Running the Application

### 1. Start Backend API (Port 5000)
```bash
cd backend
npm run dev
```

### 2. Start Frontend UI (Port 5173)
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser and click on **Knowledge Upload**.

### 3. Run Automated Backend Tests
```bash
cd backend
npm test
```
*Validates 95 automated assertions across Phase 2 (26 tests), Phase 3 (40 tests), Phase 4 (14 tests), and Phase 5 (15 tests).*

---

## 📅 Roadmap & Phases

- [x] **PHASE 1: Foundation & Dashboard**
  - React + Vite + Tailwind setup
  - Node.js + Express backend setup
  - Dark Navy & Electric Blue enterprise dashboard UI
- [x] **PHASE 2: Database & Core Management**
  - Supabase PostgreSQL schema with RLS and indexes
  - Synthetic demo data migration (3 depts, 5 employees, 2 projects)
  - Department, Employee (with HR salary shield), and Project CRUD APIs
- [x] **PHASE 3: Knowledge Ingestion & Document Processing**
  - Private Supabase Storage bucket (`handover-documents`) & local secured disk fallback
  - Document parser & text extractor for PDF, DOCX, TXT, CSV
  - Scanned PDF detection & `needs_ocr` status flagging
  - Granular chunking with traceable page/section coordinates
  - Drag-and-drop UI with document inspector and chunk browser
- [x] **PHASE 4: AI Reconstruction**
  - Google Gemini API integration (mock mode when `GEMINI_API_KEY` not set)
  - Structured knowledge reconstruction endpoints:
    - `POST /api/knowledge/analyze`
    - `GET /api/knowledge/analyses`
    - `GET /api/knowledge/analyses/:id`
    - `GET /api/knowledge/analyses/:id/findings`
    - `PATCH /api/knowledge/findings/:id/review`
  - Evidence‑linked findings with review workflow
  - Anti-hallucination chunk citation validation
  - Milestone, task, blocker & risk extraction
- [x] **PHASE 5: Handover & Replacement**
  - Handover package generation linking verified analysis to project transitions
  - Human review & manager approval workflows (`draft`, `under_review`, `approved`, `assigned`, `in_progress`, `completed`, `rejected`)
  - Status audit trail recording actor attribution
  - Successor replacement employee assignment with business rule validation (prevent self-replacement, prevent duplicate assignment)
  - Structured Day-1 Replacement Briefing generation based strictly on manager-approved findings
  - Handover and Replacements management UI
- [ ] **PHASE 6: Testing & Deployment**
  - End-to-end testing, error handling & production hosting

---

## ⚠️ Demo & Environment Disclosures

- **Database Persistence**: Running by default in an In-Memory Synthetic Repository mode when Supabase credentials are not populated in `backend/.env`. Complete idempotent schema migrations through Phase 5 (`supabase/migrations/`) are provided for one-click setup against any Supabase PostgreSQL instance.
- **Gemini AI Engine**: Runs in validated mock simulation mode when `GEMINI_API_KEY` is not populated. Set `GEMINI_API_KEY` in `backend/.env` for live Google Gemini 2.5 Flash generation.
- **Authentication**: Demo RBAC mode active for local presentation. Production security and external OAuth/JWT verification are reserved for Phase 6 deployment.

---

**HandoverIQ** — Created by Team **ROGUENOVA** for the Hackathon.
Tagline: *Preserve Knowledge. Power Continuity.*
