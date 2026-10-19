# 🏢 AI-Powered Vendor Verification Workspace

An intelligent, full-stack enterprise web application for vendor onboarding, automated document extraction via AI, company registry verification, document checklist tracking, and automated email compliance notifications.

---

## 🚀 Technical Requirements & Stack Summary

| Layer / Requirement | Technology / Service Used |
| :--- | :--- |
| **Frontend** | Next.js 14+ (App Router), React, Tailwind CSS |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI Document Processing** | Google Gemini Generative AI API (`gemini-2.0-flash-lite` / `gemini-1.5-flash`) |
| **External Company API** | OpenCorporates API (with Intelligent Fallback Engine) |
| **Email Automation** | Nodemailer (Gmail App Password / Custom SMTP / Ethereal Test Service) |
| **File Storage** | Multer Middleware (Disk Storage with MIME Type Filter) |

---

## 🌟 Key Application Features

### 1. Vendor Details & Version Audit History
- Full CRUD capabilities for onboarding vendor data.
- **Version Tracking**: Calculates field-level diffs (`previousValue` ➔ `newValue`) on every update.
- **Version Restoration**: Ability to rollback vendor details to any historical version.

### 2. AI Document Processing & Cross-Verification
- Upload support for `PDF`, `JPEG/PNG`, and `TXT` compliance documents (`GST Certificate`, `Registration Certificate`, `Bank Document`).
- **AI Data Extraction**: Google Gemini extracts company name, registration number, GST number, address, bank account number, and IFSC code.
- **Manual AI Correction**: Users can edit and save incorrectly extracted AI fields directly on screen.
- **AI Mismatch Engine**: Automatically compares form inputs against extracted document fields and flags discrepancies with visual warning badges.

### 3. External Registry Verification (OpenCorporates)
- Cross-checks vendor details with official company registries (OpenCorporates).
- Displays status: `Verified` / `Mismatch` / `Unable to Verify`.
- Includes API timeout error handling and graceful fallbacks.

### 4. Required Document Checklist & Email Automation
- Automated document completeness check: `Available` vs `Missing`.
- **Automated Missing Document Alert**: Single-click trigger sends an official HTML compliance email to the client's registered address mentioning missing files.
- Automatically updates vendor workflow status to `Action Required`.

### 5. Reviewer Workflow Pipeline & Task Management
- **Workflow Pipeline**: `Draft` ➔ `Under Review` ➔ `Action Required` ➔ `Approved` / `Rejected`.
- **Task Assignment**: Assign tasks to vendors with priorities (`Low`, `Medium`, `High`), due dates, and pending/completed status toggles.

---

## 🏗️ Architecture Explanation

```text
┌────────────────────────────────────────────────────────┐
│                   Next.js Frontend                     │
│  (Pages, Modals, Dynamic Toast Context, Components)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API Calls
┌───────────────────────────▼────────────────────────────┐
│                  Node.js / Express Server              │
│  (Controllers, Routes, Multer, Versioning Utilities)   │
└─────┬──────────────┬──────────────┬─────────────┬──────┘
      │              │              │             │
┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐ ┌────▼───────┐
│  MongoDB   │ │  Gemini AI │ │OpenCorpor. │ │ Nodemailer│
│  Database  │ │   Engine   │ │ Registry   │ │  Email    │
└────────────┘ └────────────┘ └────────────┘ └───────────┘