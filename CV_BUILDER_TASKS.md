# CV Builder — Tasks

> **Requirement:** All CV output (preview + PDF export) must be fully ATS-compliant.

---

## Setup & Data Layer

| # | Task |
|---|------|
| 1 | Define CV and Section data models (types) |
| 2 | Connect all CV API endpoints (get, save, add section, edit section, delete section, export PDF) |
| 3 | Install drag-and-drop library |
| 4 | Build CV state management (load, save, CRUD, reorder) |
| 5 | Protect the CV Builder page — students only |
| 6 | Enforce ATS-safe field structure: standard section types only (Education, Experience, Skills, Projects, Certifications) |
| 7 | Test all API calls end-to-end |

**Deliverable:** All API calls working, data loads and saves correctly.

---

## Editor Components

| # | Task |
|---|------|
| 1 | Two-column page layout (editor left, preview right) with mobile tab switcher |
| 2 | Auto-save status indicator (Saving / Saved / Error) |
| 3 | Header editor — headline, summary, phone, LinkedIn, GitHub, website with auto-save |
| 4 | Add / Edit section modal — form with dynamic field labels per section type and validation |
| 5 | ATS tip helper text shown per field (e.g. "Use standard job titles", "Avoid tables and graphics in descriptions") |
| 6 | Warn user if they use special characters, emojis, or symbols in titles or descriptions |

**Deliverable:** User can fill in the CV header and add/edit sections via the modal.

---

## Section List & Reorder

| # | Task |
|---|------|
| 1 | Section card — collapsible, color-coded by type, with edit and delete buttons |
| 2 | Section list with drag-to-reorder support |
| 3 | Delete confirmation dialog |
| 4 | Empty state screen when no sections exist |
| 5 | Lock section headings to ATS-standard labels ("Education", "Work Experience", "Skills", "Projects", "Certifications") — no custom names |
| 6 | End-to-end test: add, edit, delete, reorder sections |

**Deliverable:** Full working editor panel, data persists on refresh.

---

## Live Preview & Export

| # | Task |
|---|------|
| 1 | Live CV preview — updates in real time as the user types |
| 2 | A4-styled preview layout (sticky on desktop, tab on mobile) |
| 3 | Download CV as PDF button |
| 4 | ATS-compliant PDF output — single column, no tables, no text boxes, no images, machine-readable fonts, logical reading order |
| 5 | PDF uses standard section headings that ATS parsers recognise |
| 6 | Dates formatted consistently (Mon YYYY) throughout the PDF |
| 7 | Add CV Builder link in the student Dashboard and navigation menu |
| 8 | End-to-end test: build CV → preview → download PDF → verify ATS parse |

**Deliverable:** Complete working CV Builder including PDF download.

---

## Polish & QA

| # | Task |
|---|------|
| 1 | Loading skeletons while data is fetching |
| 2 | Error messages for all failed actions |
| 3 | Mobile responsiveness fixes |
| 4 | Accessibility audit (form labels, keyboard navigation, screen reader support) |
| 5 | Run generated PDF through a free ATS checker (e.g. Resume Worded or Jobscan) and fix any issues |
| 6 | Cross-browser test (Chrome, Firefox, Safari) |
| 7 | Code review and PR |

**Deliverable:** PR ready to merge, feature complete.
