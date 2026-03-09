# CV Builder — Front-End Implementation Documentation

> **Audience:** Front-end team  
> **Stack:** React 18 · TypeScript · Tailwind CSS · Vite  
> **Backend Base URL:** `https://futureintern-production-7d4f.up.railway.app/api`  
> **Auth:** JWT Bearer token (stored in `localStorage` as `access_token`)  
> **Accessibility:** Students only (`role === 'student'`)

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Backend API Reference](#2-backend-api-reference)
3. [TypeScript Types](#3-typescript-types)
4. [Extending `api.ts`](#4-extending-apits)
5. [File & Folder Structure](#5-file--folder-structure)
6. [Page Architecture & Routing](#6-page-architecture--routing)
7. [UI Components Breakdown](#7-ui-components-breakdown)
8. [Section-by-Section Feature Spec](#8-section-by-section-feature-spec)
9. [Live Preview Panel](#9-live-preview-panel)
10. [PDF Export](#10-pdf-export)
11. [State Management](#11-state-management)
12. [UX & Design Guidelines](#12-ux--design-guidelines)
13. [Error Handling & Loading States](#13-error-handling--loading-states)
14. [Accessibility](#14-accessibility)
15. [Implementation Checklist](#15-implementation-checklist)

---

## 1. Feature Overview

The **CV Builder** is a structured, in-browser tool that lets students compose a professional CV without uploading a file. It stores data on the server and can export a formatted PDF on demand.

### Core Capabilities

| # | Capability | Description |
|---|-----------|-------------|
| 1 | **Header editor** | Name (auto-filled from profile), headline, summary, phone, LinkedIn, GitHub, website |
| 2 | **Sectioned builder** | Add / edit / delete / reorder sections: Education, Experience, Projects, Skills, Certifications, Other |
| 3 | **Live preview** | Real-time CV preview rendered as it will look on paper |
| 4 | **PDF export** | One-click download via backend PDF generation |
| 5 | **Auto-save indicator** | Shows save status (saving / saved / error) |
| 6 | **Drag-to-reorder** | Change section item order with drag handles |

### Access Rules

- Only authenticated users with `role === 'student'` can see or use the CV Builder.
- The route must be wrapped in `<ProtectedRoute>` (already exists in the project).
- Company users and admins receive a redirect or disabled state.

---

## 2. Backend API Reference

All endpoints are prefixed with `/api/cv`. Every request **must** include the Authorization header:

```
Authorization: Bearer <access_token>
```

---

### 2.1 Get CV

```
GET /api/cv/
```

**Response 200 – CV exists:**
```json
{
  "cv": {
    "id": 1,
    "student_id": 42,
    "headline": "Computer Science Student @ Cairo University",
    "summary": "Passionate about building scalable systems...",
    "phone": "+20 100 000 0000",
    "linkedin": "https://linkedin.com/in/username",
    "github": "https://github.com/username",
    "website": "https://myportfolio.com",
    "sections": [ /* CVSection[] – see 2.3 */ ],
    "created_at": "2025-09-01T10:00:00",
    "updated_at": "2026-03-01T12:30:00"
  }
}
```

**Response 200 – No CV yet:**
```json
{ "cv": null, "message": "No CV created yet" }
```

---

### 2.2 Create or Update CV Header

```
POST /api/cv/
Content-Type: application/json
```

**Request body** (all fields optional — send only what changed):
```json
{
  "headline": "string (max 200 chars)",
  "summary":  "string (free text)",
  "phone":    "string (max 300 chars)",
  "linkedin": "string (max 300 chars)",
  "github":   "string (max 300 chars)",
  "website":  "string (max 300 chars)"
}
```

**Response 200:**
```json
{ "message": "CV saved", "cv": { /* full CV object */ } }
```

> ⚠️ If no CV record exists yet, the backend **auto-creates** one. You do not need a separate "create" call.

---

### 2.3 Add a Section

```
POST /api/cv/sections
Content-Type: application/json
```

**Request body:**
```json
{
  "section_type": "education",
  "title":        "Bachelor of Computer Science",
  "subtitle":     "Cairo University",
  "location":     "Cairo, Egypt",
  "start_date":   "Sep 2021",
  "end_date":     "Present",
  "description":  "Relevant coursework: Data Structures, Operating Systems...",
  "order_index":  0
}
```

**Allowed `section_type` values:**
`education` | `experience` | `skills` | `projects` | `certifications` | `other`

**Response 201:**
```json
{ "message": "Section added", "section": { /* CVSection object */ } }
```

**CVSection object shape:**
```json
{
  "id": 7,
  "cv_id": 1,
  "section_type": "education",
  "title": "Bachelor of Computer Science",
  "subtitle": "Cairo University",
  "location": "Cairo, Egypt",
  "start_date": "Sep 2021",
  "end_date": "Present",
  "description": "...",
  "order_index": 0
}
```

---

### 2.4 Update a Section

```
PUT /api/cv/sections/<section_id>
Content-Type: application/json
```

Send only the fields you want to change:
```json
{
  "title": "New Title",
  "end_date": "Jun 2025",
  "order_index": 2
}
```

**Response 200:**
```json
{ "message": "Section updated", "section": { /* updated CVSection */ } }
```

---

### 2.5 Delete a Section

```
DELETE /api/cv/sections/<section_id>
```

**Response 200:**
```json
{ "message": "Section deleted" }
```

---

### 2.6 Export CV as PDF

```
GET /api/cv/export/pdf
Authorization: Bearer <token>
```

**Response:** binary PDF (`application/pdf`)  
**Content-Disposition:** `attachment; filename="CV_Firstname_Lastname.pdf"`

The browser should trigger a file download. See [Section 10](#10-pdf-export) for frontend implementation.

---

## 3. TypeScript Types

Add these to `src/types.ts`:

```typescript
// ─── CV Builder ───────────────────────────────────────────────────────────────

export type CVSectionType =
  | 'education'
  | 'experience'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'other';

export interface CVSection {
  id: number;
  cv_id: number;
  section_type: CVSectionType;
  title: string;
  subtitle?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  order_index: number;
}

export interface CV {
  id: number;
  student_id: number;
  headline?: string;
  summary?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  sections: CVSection[];
  created_at: string;
  updated_at: string;
}

/** Data sent when creating or updating a section */
export interface CVSectionPayload {
  section_type: CVSectionType;
  title: string;
  subtitle?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  order_index?: number;
}

/** Data sent when saving CV header */
export interface CVHeaderPayload {
  headline?: string;
  summary?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}
```

---

## 4. Extending `api.ts`

Add a `cv` namespace inside the `api` object in `src/services/api.ts`:

```typescript
// ========== CV Builder ==========
cv: {
  /** Fetch the student's full CV (returns null if none created yet) */
  get: async (): Promise<{ cv: CV | null; message?: string }> => {
    return apiRequest('/cv/');
  },

  /** Create or update CV header fields */
  saveHeader: async (data: CVHeaderPayload): Promise<{ message: string; cv: CV }> => {
    return apiRequest('/cv/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Add a new section */
  addSection: async (data: CVSectionPayload): Promise<{ message: string; section: CVSection }> => {
    return apiRequest('/cv/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Update an existing section */
  updateSection: async (id: number, data: Partial<CVSectionPayload>): Promise<{ message: string; section: CVSection }> => {
    return apiRequest(`/cv/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /** Delete a section */
  deleteSection: async (id: number): Promise<{ message: string }> => {
    return apiRequest(`/cv/sections/${id}`, {
      method: 'DELETE',
    });
  },

  /** Download CV as PDF — returns a Blob */
  exportPDF: async (): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/cv/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('PDF export failed');
    return response.blob();
  },
},
```

> **Import note:** Import `CV`, `CVHeaderPayload`, `CVSectionPayload`, `CVSection` from `../types` at the top of `api.ts`.

---

## 5. File & Folder Structure

Create the following files inside `src/`:

```
src/
├── pages/
│   └── CVBuilder.tsx              ← Main page (editor + preview layout)
│
├── components/
│   └── cv/
│       ├── CVHeader.tsx           ← Name, headline, summary, contact fields
│       ├── CVSectionList.tsx      ← Renders the draggable list of all sections
│       ├── CVSectionCard.tsx      ← Individual collapsible section card
│       ├── CVSectionForm.tsx      ← Add/Edit section modal/drawer form
│       ├── CVPreview.tsx          ← Live preview panel (right column)
│       ├── CVPreviewSection.tsx   ← Renders one section in the preview
│       ├── CVExportButton.tsx     ← PDF download button with loading state
│       └── CVSaveStatus.tsx       ← "Saving…" / "All changes saved" indicator
│
└── hooks/
    └── useCV.ts                   ← Custom hook: fetch, save, sections CRUD
```

---

## 6. Page Architecture & Routing

### Route

Add to `App.tsx`:

```tsx
import CVBuilder from './pages/CVBuilder';

// Inside <Routes>
<Route
  path="/cv-builder"
  element={
    <ProtectedRoute allowedRoles={['student']}>
      <CVBuilder />
    </ProtectedRoute>
  }
/>
```

### Navigation

Add a **"Build My CV"** link in the student Dashboard and in the Navbar (student dropdown).

### Page Layout — `CVBuilder.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar                                                      │
├────────────────────────────┬─────────────────────────────────┤
│                            │                                 │
│   EDITOR PANEL (left)      │   LIVE PREVIEW (right)          │
│   ─────────────────        │   ──────────────────────        │
│   • CVSaveStatus           │   • A4-style white card         │
│   • CVHeader               │   • CVPreview (read-only)       │
│   • CVSectionList          │   • CVExportButton (Download    │
│     └─ CVSectionCard ×N    │     PDF button)                 │
│   • [+ Add Section] btn    │                                 │
│                            │                                 │
│   (scrollable)             │   (sticky / scrollable)         │
└────────────────────────────┴─────────────────────────────────┘
```

On **mobile** (<768 px): show in tabs:  
`[✏️ Edit]` tab → editor panel  
`[👁 Preview]` tab → live preview

---

## 7. UI Components Breakdown

### 7.1 `CVHeader.tsx`

Fields to render:

| Field | Input type | Placeholder / hint | Max length |
|-------|-----------|-------------------|------------|
| **Headline** | `<input type="text">` | e.g. "CS Student @ Cairo University" | 200 |
| **Summary** | `<textarea rows={4}>` | "Write a short summary about yourself…" | unlimited |
| **Phone** | `<input type="tel">` | "+20 100 000 0000" | 20 |
| **LinkedIn** | `<input type="url">` | "https://linkedin.com/in/…" | 300 |
| **GitHub** | `<input type="url">` | "https://github.com/…" | 300 |
| **Website** | `<input type="url">` | "https://…" | 300 |

- **Name & Email** are read-only, auto-filled from `useAuth()` user object.
- Trigger `api.cv.saveHeader()` on blur (or with 800 ms debounce while typing).
- Show `CVSaveStatus` indicator next to the section title.

---

### 7.2 `CVSectionList.tsx`

- Renders all `CVSection[]` grouped — but displayed in the global `order_index` order.
- Each item is a `<CVSectionCard>`.
- **Drag handle** (⠿ icon) on the left side of each card — use the `@dnd-kit/core` library for drag-and-drop.
- After reorder, update `order_index` of affected items via `api.cv.updateSection()`.

**Install dependency:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

### 7.3 `CVSectionCard.tsx`

```
┌──────────────────────────────────────────────────────┐
│  ⠿  [education]  Bachelor of Computer Science        │  ← collapsed
│                 Cairo University · Sep 2021–Present  │
│                                                 ✏️ 🗑 │
└──────────────────────────────────────────────────────┘
```

- Click anywhere on the card (except buttons) to **expand** and show full details.
- **Edit** (✏️) button → opens `CVSectionForm` pre-filled.
- **Delete** (🗑) button → shows a confirm dialog, then calls `api.cv.deleteSection(id)`.
- Show a colored left border or badge for each section type:

| Section type | Color (Tailwind) |
|---|---|
| education | `border-blue-500` |
| experience | `border-green-500` |
| projects | `border-purple-500` |
| skills | `border-yellow-500` |
| certifications | `border-orange-500` |
| other | `border-gray-400` |

---

### 7.4 `CVSectionForm.tsx`

A **modal** (or right-side drawer) form used for both **Add** and **Edit** actions.

```
┌──────────────────────────────────────────┐
│  Add / Edit Section                  ✕  │
│  ──────────────────────────────────────  │
│  Section Type:  [select dropdown ▼]      │
│  Title:         [________________________]│
│  Subtitle:      [________________________]│
│  Location:      [________________________]│
│  Start Date:    [__________]             │
│  End Date:      [__________] ☐ Present   │
│  Description:   [                      ] │
│                 [                      ] │
│                 [                      ] │
│  ──────────────────────────────────────  │
│             [Cancel]  [Save Section]     │
└──────────────────────────────────────────┘
```

**Fields:**

| Field | Input | Notes |
|-------|-------|-------|
| Section Type | `<select>` | Disabled when editing (type cannot change) |
| Title | `<input>` | Required. Label changes per section type (see table below) |
| Subtitle | `<input>` | Optional |
| Location | `<input>` | Optional |
| Start Date | `<input type="text">` | Format: "Sep 2021" or "2021-09" |
| End Date | `<input type="text">` | Auto-fills "Present" when checkbox ticked |
| Description | `<textarea rows={5}>` | Bullet points accepted |

**Dynamic label mapping by section type:**

| Section Type | Title label | Subtitle label |
|---|---|---|
| `education` | Degree / Certificate | University / Institution |
| `experience` | Job Title | Company |
| `projects` | Project Name | Technologies Used |
| `skills` | Skill Category | — (hide subtitle) |
| `certifications` | Certification Name | Issuing Organization |
| `other` | Title | Subtitle |

**Validation (client-side):**
- `title` is required — show inline error if empty on submit
- URL fields: validate format if filled
- Date fields: warn if `end_date` is earlier than `start_date` (string comparison)

---

### 7.5 `CVPreview.tsx`

A styled read-only rendering of the CV that mirrors the PDF output. Design as an A4-proportioned white card.

```
┌────────────────────────────────────────┐
│          JOHN DOE                      │  ← user.name  (bold, centered, 20px)
│  CS Student @ Cairo University         │  ← headline   (grey, centered)
│  john@email.com  |  +20 100 xxx  |  🔗 │  ← contacts  (grey, centered)
│ ────────────────────────────────────── │
│ Summary                                │
│ Lorem ipsum dolor sit amet…           │
│ ────────────────────────────────────── │
│ Education                              │  ← section type heading
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Bachelor of Computer Science           │  ← title (bold)
│ Cairo University  (Sep 2021 – Present) │  ← subtitle + dates
│ Relevant coursework: …                 │  ← description
└────────────────────────────────────────┘
```

- Section rendering order: `education → experience → projects → skills → certifications → other`
- Sections with no items are hidden.
- This component is **pure display** — it receives the `cv` state as a prop.

---

### 7.6 `CVExportButton.tsx`

```tsx
<button onClick={handleExport} disabled={isExporting}>
  {isExporting ? 'Generating PDF…' : '⬇ Download PDF'}
</button>
```

Calls `api.cv.exportPDF()` (see Section 10 for the full download logic).

---

### 7.7 `CVSaveStatus.tsx`

Displays a small inline status indicator:

| State | Display |
|-------|---------|
| idle | *(hidden)* |
| saving | 🔄 Saving… |
| saved | ✅ All changes saved |
| error | ❌ Save failed — retry |

Auto-hides "saved" message after 3 seconds.

---

## 8. Section-by-Section Feature Spec

### Education

Example entry:
> **Bachelor of Computer Science**  
> Cairo University · Cairo, Egypt · Sep 2021 – Present  
> *Dean's list 2022, Relevant coursework: Data Structures, Algorithms, OS*

### Work Experience

Example entry:
> **Software Engineering Intern**  
> Vodafone Egypt · Giza, Egypt · Jun 2024 – Aug 2024  
> - Built REST APIs using Flask and PostgreSQL  
> - Reduced query time by 40% through indexing

**Description tip:** Show a helper text: *"Use bullet points starting with action verbs (Built, Designed, Reduced…)"*

### Projects

Example entry:
> **FutureIntern Platform**  
> React, TypeScript, Flask, PostgreSQL  
> An AI-powered internship matching platform for students.  
> 🔗 github.com/username/project

### Skills

Skills have a different form layout — instead of the full date/location fields, show:
- **Category** (title field): e.g. "Programming Languages"
- **Skills list** (description field): e.g. "Python, JavaScript, TypeScript, SQL"

The CV preview renders skills as a two-column tag cloud:
```
Programming Languages   Python · JavaScript · TypeScript · SQL
Tools & Frameworks      React · Flask · PostgreSQL · Docker
```

### Certifications

Example entry:
> **AWS Certified Developer – Associate**  
> Amazon Web Services · Issued Jul 2025 · Expires Jul 2027

### Other

Free-form section for languages, volunteer work, awards, publications, etc.

---

## 9. Live Preview Panel

The preview panel updates in **real time** as the user types (no save required for preview update).

### Implementation approach

```tsx
// CVBuilder.tsx – simplified state flow
const [cv, setCV] = useState<CV | null>(null);  // loaded from backend on mount

// Pass cv directly into preview — no API call needed for preview
<CVPreview cv={cv} userName={user?.name} userEmail={user?.email} />
```

The preview reacts to local state changes immediately. API calls (save) happen separately in the background.

### Preview scroll sync

- On desktop: the preview panel is `position: sticky` so it stays visible while the editor scrolls.
- Tailwind classes: `lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto`

---

## 10. PDF Export

The backend streams a binary PDF. The frontend must handle a Blob response.

```typescript
// Inside CVExportButton.tsx

const handleExport = async () => {
  setIsExporting(true);
  try {
    const blob = await api.cv.exportPDF();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CV_${user?.name?.replace(/\s+/g, '_') ?? 'resume'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PDF export failed', err);
    // Show toast/alert to user
  } finally {
    setIsExporting(false);
  }
};
```

> **Note:** This endpoint requires the CV to have at least a header saved. Show a warning if `cv === null`.

---

## 11. State Management

Use a single custom hook `useCV` to encapsulate all CV logic:

```typescript
// src/hooks/useCV.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { CV, CVHeaderPayload, CVSectionPayload, CVSection } from '../types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useCV() {
  const [cv, setCV] = useState<CV | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load CV on mount
  useEffect(() => {
    api.cv.get().then(res => {
      setCV(res.cv);
      setLoading(false);
    });
  }, []);

  const markSaved = () => {
    setSaveStatus('saved');
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // Save header
  const saveHeader = useCallback(async (data: CVHeaderPayload) => {
    setSaveStatus('saving');
    try {
      const res = await api.cv.saveHeader(data);
      setCV(res.cv);
      markSaved();
    } catch {
      setSaveStatus('error');
    }
  }, []);

  // Add section
  const addSection = useCallback(async (data: CVSectionPayload) => {
    setSaveStatus('saving');
    try {
      const res = await api.cv.addSection(data);
      setCV(prev => prev
        ? { ...prev, sections: [...prev.sections, res.section] }
        : null
      );
      markSaved();
      return res.section;
    } catch {
      setSaveStatus('error');
    }
  }, []);

  // Update section
  const updateSection = useCallback(async (id: number, data: Partial<CVSectionPayload>) => {
    setSaveStatus('saving');
    try {
      const res = await api.cv.updateSection(id, data);
      setCV(prev => prev
        ? { ...prev, sections: prev.sections.map(s => s.id === id ? res.section : s) }
        : null
      );
      markSaved();
    } catch {
      setSaveStatus('error');
    }
  }, []);

  // Delete section
  const deleteSection = useCallback(async (id: number) => {
    setSaveStatus('saving');
    try {
      await api.cv.deleteSection(id);
      setCV(prev => prev
        ? { ...prev, sections: prev.sections.filter(s => s.id !== id) }
        : null
      );
      markSaved();
    } catch {
      setSaveStatus('error');
    }
  }, []);

  // Reorder sections (update order_index for affected items)
  const reorderSections = useCallback(async (reordered: CVSection[]) => {
    // Optimistic update
    setCV(prev => prev ? { ...prev, sections: reordered } : null);
    // Persist each changed order_index
    const promises = reordered.map((s, i) =>
      s.order_index !== i ? api.cv.updateSection(s.id, { order_index: i }) : Promise.resolve()
    );
    await Promise.all(promises);
  }, []);

  return {
    cv,
    loading,
    saveStatus,
    saveHeader,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
  };
}
```

---

## 12. UX & Design Guidelines

### Colour palette (consistent with existing app)
- Primary: `#1a1a2e` (dark navy — already used in backend PDF)
- Accent / CTA buttons: existing Tailwind classes used across the app (`bg-blue-600`, `hover:bg-blue-700`)
- Section type badge background: semi-transparent coloured chip

### Layout
- **Desktop:** Two-column `grid grid-cols-2 gap-6` or `flex`.  
  Editor column: `w-full max-w-xl`, Preview column: `w-full max-w-xl`.
- **Mobile:** Single column with tab switcher.

### Typography
- Section headings in the editor: `text-lg font-semibold text-gray-800`
- Form labels: `text-sm font-medium text-gray-600`
- Preview: mirrors the backend PDF — `font-sans` for body, bold for titles

### Animations
- Section cards expand/collapse with `transition-all duration-200`
- Modal opens with a fade + slide-up: `animate-in fade-in slide-in-from-bottom-4`
- Save status appears/disappears with opacity transition

### Empty state
When `cv === null` or `cv.sections.length === 0`, show a friendly empty state:

```
   📄
   Your CV is empty
   Start by adding a headline and your first section below.
   [+ Add Education]   [+ Add Experience]
```

---

## 13. Error Handling & Loading States

### Loading skeleton
While `loading === true`, show a skeleton placeholder for both the editor and preview panels.

### API errors
- Wrap all API calls in try/catch.
- On network error: show a toast notification (if the app has a toast system) or an inline error banner.
- On 403 (non-student): redirect to `/unauthorized`.
- On 404 (section not found): remove the item from local state and show a toast.

### Confirmation dialogs
Always confirm destructive actions:
```
Are you sure you want to delete this section?
This action cannot be undone.
[Cancel]   [Delete]
```

---

## 14. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| All form inputs have `<label>` | Use `htmlFor` or `aria-label` |
| Modal traps focus | Use `@radix-ui/react-dialog` or a simple `focus-trap` |
| Drag handles keyboard-accessible | `@dnd-kit/core` supports keyboard navigation |
| ARIA live region for save status | `<div aria-live="polite">` wrapping `CVSaveStatus` |
| Color is not the only info carrier | Section type uses badge text + border color |
| Sufficient color contrast | All text ≥ 4.5:1 against background |

---

## 15. Implementation Checklist

Use this as a task board for the sprint:

### Setup
- [ ] Add TypeScript types to `src/types.ts`
- [ ] Add `api.cv` namespace to `src/services/api.ts`
- [ ] Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [ ] Add route `/cv-builder` in `App.tsx`
- [ ] Add navigation link in student Dashboard and Navbar

### Core Logic
- [ ] Implement `useCV` custom hook (`src/hooks/useCV.ts`)
- [ ] Implement `CVBuilder.tsx` page with two-column layout
- [ ] Implement mobile tab switcher

### Editor Components
- [ ] `CVHeader.tsx` — header fields with debounced auto-save
- [ ] `CVSectionList.tsx` — renders section cards, integrates drag-to-reorder
- [ ] `CVSectionCard.tsx` — collapsible card with edit/delete actions
- [ ] `CVSectionForm.tsx` — add/edit modal with dynamic field labels and validation
- [ ] `CVSaveStatus.tsx` — saving/saved/error indicator
- [ ] Section type color badges

### Preview Components
- [ ] `CVPreview.tsx` — full A4-style preview layout
- [ ] `CVPreviewSection.tsx` — renders one group of sections inside preview
- [ ] Sticky positioning on desktop, tab on mobile

### Export
- [ ] `CVExportButton.tsx` — PDF download with loading state and Blob handling

### Polish
- [ ] Empty state when no CV exists
- [ ] Loading skeletons
- [ ] Delete confirmation dialog
- [ ] Error toasts / inline error messages
- [ ] Accessibility audit (labels, focus trap, aria-live)
- [ ] Mobile responsiveness test

---

## Quick-Start Summary

> **tl;dr for the dev starting tomorrow:**
>
> 1. Copy the TypeScript types from Section 3 into `types.ts`.
> 2. Copy the `cv` API block from Section 4 into `api.ts`.
> 3. Create `src/hooks/useCV.ts` from Section 11.
> 4. Build `CVSectionForm.tsx` (the modal) first — it's the most complex component.
> 5. Build `CVPreview.tsx` second — it drives design decisions for the rest.
> 6. Assemble `CVBuilder.tsx` last to wire everything together.
> 7. Add the route to `App.tsx` and a link in the student Dashboard.

---

## Implementation Timeline

> **Total estimated time: 5 working days**  
> Assumes 1 front-end developer working full-time on this feature.

---

### Day 1 — Monday, March 9 · Setup & Data Layer
**Goal:** API integration and state management fully working before any UI is built.

| # | Task | Est. |
|---|------|------|
| 1 | Add TypeScript types to `src/types.ts` | 30 min |
| 2 | Add `api.cv` namespace to `src/services/api.ts` | 45 min |
| 3 | Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` | 10 min |
| 4 | Implement `src/hooks/useCV.ts` (fetch, save, CRUD, reorder) | 2 hr |
| 5 | Add `/cv-builder` route in `App.tsx` with `ProtectedRoute` | 20 min |
| 6 | Manually test all 6 API endpoints via the hook (console.log) | 1 hr |

**End-of-day deliverable:** All API calls working, hook returns correct data.

---

### Day 2 — Tuesday, March 10 · Editor Components
**Goal:** The left-side editor panel is fully functional (no preview yet).

| # | Task | Est. |
|---|------|------|
| 1 | `CVBuilder.tsx` — scaffold page layout (two columns, mobile tabs) | 1 hr |
| 2 | `CVSaveStatus.tsx` — saving / saved / error indicator | 30 min |
| 3 | `CVHeader.tsx` — all fields with debounced auto-save | 1.5 hr |
| 4 | `CVSectionForm.tsx` — modal with dynamic labels and validation | 2.5 hr |

**End-of-day deliverable:** User can fill in header and add/edit sections via the modal.

---

### Day 3 — Wednesday, March 11 · Section List & Reorder
**Goal:** Section cards render correctly and drag-to-reorder works.

| # | Task | Est. |
|---|------|------|
| 1 | `CVSectionCard.tsx` — collapsible card, color badges, edit/delete buttons | 2 hr |
| 2 | `CVSectionList.tsx` — renders all cards, integrates dnd-kit sortable | 2 hr |
| 3 | Delete confirmation dialog | 30 min |
| 4 | Empty state when no sections exist | 30 min |
| 5 | Manual test: add, edit, delete, reorder sections end-to-end | 1 hr |

**End-of-day deliverable:** Full working editor panel, data persists on refresh.

---

### Day 4 — Thursday, March 12 · Preview & Export
**Goal:** Live preview and PDF download working.

| # | Task | Est. |
|---|------|------|
| 1 | `CVPreviewSection.tsx` — renders one section group | 1 hr |
| 2 | `CVPreview.tsx` — A4 layout, sticky desktop, tab mobile | 2 hr |
| 3 | `CVExportButton.tsx` — Blob download with loading state | 45 min |
| 4 | Wire preview into `CVBuilder.tsx` (real-time state updates) | 30 min |
| 5 | Add navigation link in student Dashboard and Navbar | 30 min |
| 6 | Manual end-to-end test: build CV → preview → download PDF | 1 hr |

**End-of-day deliverable:** Complete working CV Builder including PDF download.

---

### Day 5 — Friday, March 13 · Polish & QA
**Goal:** Production-ready quality — no rough edges.

| # | Task | Est. |
|---|------|------|
| 1 | Loading skeletons for editor and preview panels | 1 hr |
| 2 | Error toasts / inline error messages for all API failures | 1 hr |
| 3 | Mobile responsiveness full test & fixes | 1.5 hr |
| 4 | Accessibility audit (labels, focus trap, aria-live, contrast) | 1 hr |
| 5 | Cross-browser test (Chrome, Firefox, Safari) | 30 min |
| 6 | Code review, cleanup, PR raised | 1 hr |

**End-of-day deliverable:** PR ready to merge, feature complete.

---

### Timeline Summary

```
Week of March 9–13, 2026
─────────────────────────────────────────────────────────────
Mon 09  │ Setup & Data Layer     (types, api.ts, useCV hook)
Tue 10  │ Editor Components      (header, section form modal)
Wed 11  │ Section List & Reorder (cards, dnd-kit, delete)
Thu 12  │ Preview & Export       (CVPreview, PDF download)
Fri 13  │ Polish & QA            (skeletons, errors, mobile, a11y)
─────────────────────────────────────────────────────────────
Deadline: Friday, March 13 · PR merged by EOD
```

---

*Generated: March 3, 2026 · FutureIntern Project*
