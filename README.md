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
| **Backend** | Node.js, Express.js |
| **Database & Storage** | Supabase (PostgreSQL) & Supabase Object Storage |
| **Artificial Intelligence** | Google Gemini API (Structured Work History & Milestones) |
| **Design System** | Dark Navy (`#0B1020`), Deep Blue (`#14213D`), Electric Blue (`#3B82F6`) |

---

## 🧭 Complete Handover Lifecycle Pipeline

```
Company 
  └── Departments (IT, HR, Finance, Marketing, Operations)
        └── Employees (HR-isolated salary privacy)
              └── Projects (Responsibilities & milestones)
                    └── Knowledge Upload (PDF, DOCX, TXT, CSV)
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

### 2. Migration Execution Instructions

To set up your Supabase database:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to **SQL Editor**.
2. Run migration **[supabase/migrations/20261112000000_create_core_schema.sql](file:///d:/AI-Powered%20Employee%20Knowledge%20Handover%20&%20Replacement%20Management%20System/supabase/migrations/20261112000000_create_core_schema.sql)**.
   - Creates `departments`, `employees`, `projects`, `project_members`.
   - Activates Row Level Security (RLS) policies and performance indexes.
   - Configures the `public_employees` view which omits confidential compensation data.
3. Run seed migration **[supabase/migrations/20261112000001_seed_demo_data.sql](file:///d:/AI-Powered%20Employee%20Knowledge%20Handover%20&%20Replacement%20Management%20System/supabase/migrations/20261112000001_seed_demo_data.sql)**.
   - Idempotently populates 3 departments (IT, HR, Finance), 5 employees, 2 enterprise projects, and mapped member responsibilities (`ON CONFLICT DO NOTHING`).
4. Copy your **Project URL**, **anon key**, and **service_role key** from *Project Settings → API* into `backend/.env`.

---

## 🔐 Security & Confidential Salary Safeguards

- **Backend RBAC Isolation**: Employee compensation figures (`salary`) are strictly omitted from standard employee/manager queries at the database query and backend layer.
- **Header/Token Verification**: Only requests containing authorized HR roles (`x-user-role: hr`) receive or modify salary data.
- **AI Context Isolation**: Salary data is shielded by design and **never** included in prompt contexts sent to Google Gemini.
- **Database View**: A public database view `public_employees` is provided which excludes salary entirely.

---

## 📡 REST API Reference

### Health & Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend and service connectivity health monitor |
| `GET` | `/api/dashboard/stats` | Real-time counts (departments, employees, projects, active handovers) |

### Departments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/departments` | List all departments with descriptions |
| `GET` | `/api/departments/:id` | Get specific department by UUID |
| `POST` | `/api/departments` | Create new department (`name` required, unique) |
| `PUT` | `/api/departments/:id` | Update department name or description |
| `DELETE`| `/api/departments/:id` | Delete department (`RESTRICT` if employees assigned) |

### Employees
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/employees` | List all employees (supports `?department_id=` & `?search=`). Salary is hidden unless authorized with `x-user-role: hr` |
| `GET` | `/api/employees/:id` | Get specific employee profile |
| `POST` | `/api/employees` | Register new employee (`full_name`, `email`, `designation`, `department_id`) |
| `PUT` | `/api/employees/:id` | Update employee profile or status |
| `DELETE`| `/api/employees/:id` | Remove employee and detach project responsibilities |

### Projects & Assignments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects (supports `?status=` & `?search=`) |
| `GET` | `/api/projects/:id` | Get project details with full assigned members and responsibilities |
| `POST` | `/api/projects` | Create project (`name`, `description`, `status`, dates) |
| `PUT` | `/api/projects/:id` | Update project metadata |
| `DELETE`| `/api/projects/:id` | Delete project (`CASCADE` members) |
| `GET` | `/api/projects/:id/members` | List employees assigned to a project |
| `POST` | `/api/projects/:id/members` | Assign employee with specific responsibility & work status |
| `DELETE`| `/api/projects/:id/members/:employeeId` | Remove employee assignment from project |

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
Open **http://localhost:5173** in your browser.

### 3. Run Automated Backend Tests
```bash
cd backend
npm test
```
*Validates 26 automated assertions across live stats, department CRUD, employee RBAC salary shielding, foreign key restrictions, project management, and member assignments.*

---

## 📅 Roadmap & Phases

- [x] **PHASE 1: Foundation & Dashboard**
  - React + Vite + Tailwind setup
  - Node.js + Express backend setup
  - Dark Navy & Electric Blue enterprise dashboard UI
  - Real-time backend connection health monitoring
- [x] **PHASE 2: Database & Core Management**
  - Supabase PostgreSQL schema with RLS and indexes
  - Synthetic demo data migration (3 depts, 5 employees, 2 projects)
  - Department, Employee (with HR salary shield), and Project CRUD APIs
  - Project member responsibility and work status assignment
  - Live dynamic dashboard counts from database
- [ ] **PHASE 3: Knowledge Ingestion**
  - Multi-format document parser (PDF, DOCX, TXT, CSV)
  - Supabase storage integration with citation metadata
- [ ] **PHASE 4: AI Reconstruction**
  - Google Gemini API integration
  - Milestone, task, blocker & risk extraction
- [ ] **PHASE 5: Handover & Replacement**
  - Evidence-linked report generation
  - Human review & manager approval workflows
  - Successor onboarding briefing generator
- [ ] **PHASE 6: Testing & Deployment**
  - End-to-end testing, error handling & production hosting

---

**HandoverIQ** — Created by Team **ROGUENOVA** for the Hackathon.
