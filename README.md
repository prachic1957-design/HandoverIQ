# HandoverIQ

> **Tagline:** Preserve Knowledge. Power Continuity.  
> **Team:** ROGUENOVA  
> **Project:** AI-Powered Employee Knowledge Handover & Replacement Management System  

---

## 📌 Executive Summary

**HandoverIQ** is an enterprise-grade, AI-powered knowledge transfer platform engineered to prevent organizational knowledge loss when team members transition or depart. 

Built for modern distributed organizations, HandoverIQ collects authorized project documentation, reconstructs unstructured work history into evidence-backed handover dossiers using Google Gemini, facilitates human review and manager approval, and prepares tailored Day-1 briefings for replacement employees.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database & Storage** | Supabase (PostgreSQL) & Supabase Object Storage |
| **Artificial Intelligence** | Google Gemini API (Structured Work Reconstruction) |
| **Design System** | Dark Navy (`#0B1020`), Deep Blue (`#14213D`), Electric Blue (`#3B82F6`) |

---

## 🧭 Complete End-to-End Workflow

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

## 🏗️ Project Structure

```
HandoverIQ/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js            # Environment loader & validation
│   │   │   └── supabase.js       # Supabase client wrapper & safe mock
│   │   ├── routes/
│   │   │   └── health.js         # API & system health check endpoint
│   │   └── server.js             # Express application entrypoint
│   ├── .env.example              # Backend environment template
│   ├── .gitignore                # Backend ignore rules
│   └── package.json              # Backend dependencies
│
├── frontend/
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # Top navigation with live backend monitor
│   │   │   ├── Sidebar.jsx       # Brand navigation & module tabs
│   │   │   ├── StatCard.jsx      # Metric stat cards with trend badges
│   │   │   ├── DashboardOverview.jsx # Executive operations dashboard
│   │   │   └── ModulePlaceholder.jsx # Interactive module previews
│   │   ├── App.jsx               # Root application component
│   │   ├── index.css             # Tailwind base & custom scrollbars
│   │   └── main.jsx              # Vite entrypoint
│   ├── index.html                # Application HTML with Inter font
│   ├── tailwind.config.js        # Custom enterprise palette configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── .env.example              # Frontend environment template
│   └── package.json              # Frontend dependencies
│
├── .env.example                  # Global environment variables template
├── .gitignore                    # Root gitignore protecting sensitive keys
├── package.json                  # Root orchestration scripts
└── README.md                     # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.x, v20.x, or v22.x)
- **npm** (v9.x or higher)

### 2. Installation
Open your terminal in the project root directory and run:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup
Both frontend and backend include ready-to-use `.env.example` templates:

```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env
```

### 4. Running the Application

**Terminal 1 — Start the Backend API (Port 5000):**
```bash
cd backend
npm run dev
```
*Health verification endpoint available at:* `http://localhost:5000/api/health`

**Terminal 2 — Start the Frontend (Vite, Port 5173):**
```bash
cd frontend
npm run dev
```
*Open in your browser:* `http://localhost:5173`

---

## 🔐 Strict Security Safeguards
- **HR Salary Isolation**: Salary and compensation figures are strictly restricted to authorized HR views and are **never** passed into AI prompt contexts.
- **Evidence-Linked Claims**: AI generates claims linked to verified source documents, eliminating hallucination.
- **Environment Protection**: All sensitive keys (`.env`, `node_modules`) are committed to `.gitignore`.

---

## 📅 Roadmap & Phases

- [x] **PHASE 1: Foundation & Dashboard** *(Current)*
  - React + Vite + Tailwind setup
  - Node.js + Express backend setup
  - Supabase client architecture template
  - Dark Navy & Electric Blue enterprise dashboard UI
  - Real-time backend connection health monitoring
- [ ] **PHASE 2: Database & Core Management**
  - Supabase schema definition & migration
  - Department, Employee & Project CRUD APIs
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
